const express = require('express');
const mongoose = require('mongoose');
const Game = require('../models/Game');
const Player = require('../models/Player');
const Deck = require('../models/Deck');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get player statistics
// @route   GET /stats/player/:id
// @access  Private
router.get('/player/:id', protect, async (req, res, next) => {
  try {
    const playerId = req.params.id;

    // Validate player exists
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Get all games for this player
    const games = await Game.find({ 'players.player': playerId })
      .populate('players.deck', 'name commander');

    // Calculate statistics
    const totalGames = games.length;
    const wins = games.filter(game => 
      game.players.find(p => p.player.toString() === playerId && p.placement === 1)
    ).length;
    const winRate = totalGames > 0 ? (wins / totalGames * 100).toFixed(2) : 0;

    // Calculate average placement
    const placements = games.map(game => 
      game.players.find(p => p.player.toString() === playerId).placement
    );
    const averagePlacement = totalGames > 0 ? 
      (placements.reduce((sum, placement) => sum + placement, 0) / totalGames).toFixed(2) : 0;

    // Get deck usage statistics
    const deckUsage = {};
    games.forEach(game => {
      const playerData = game.players.find(p => p.player.toString() === playerId);
      const deckId = playerData.deck._id.toString();
      const deckName = playerData.deck.name;
      const commander = playerData.deck.commander;
      
      if (!deckUsage[deckId]) {
        deckUsage[deckId] = {
          deck: { _id: deckId, name: deckName, commander },
          gamesPlayed: 0,
          wins: 0,
          averagePlacement: 0,
          placements: []
        };
      }
      
      deckUsage[deckId].gamesPlayed++;
      deckUsage[deckId].placements.push(playerData.placement);
      if (playerData.placement === 1) {
        deckUsage[deckId].wins++;
      }
    });

    // Calculate average placement for each deck
    Object.keys(deckUsage).forEach(deckId => {
      const deck = deckUsage[deckId];
      deck.averagePlacement = (deck.placements.reduce((sum, p) => sum + p, 0) / deck.placements.length).toFixed(2);
      deck.winRate = ((deck.wins / deck.gamesPlayed) * 100).toFixed(2);
      delete deck.placements; // Remove placements array from response
    });

    // Sort decks by games played
    const sortedDeckUsage = Object.values(deckUsage)
      .sort((a, b) => b.gamesPlayed - a.gamesPlayed);

    // Get recent games (last 10)
    const recentGames = games
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map(game => ({
        _id: game._id,
        date: game.date,
        placement: game.players.find(p => p.player.toString() === playerId).placement,
        deck: game.players.find(p => p.player.toString() === playerId).deck,
        playerCount: game.players.length
      }));

    // Calculate placement distribution
    const placementDistribution = {};
    placements.forEach(placement => {
      placementDistribution[placement] = (placementDistribution[placement] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        player: {
          _id: player._id,
          name: player.name,
          nickname: player.nickname,
          profileImage: player.profileImage
        },
        statistics: {
          totalGames,
          wins,
          winRate: parseFloat(winRate),
          averagePlacement: parseFloat(averagePlacement),
          placementDistribution
        },
        deckUsage: sortedDeckUsage,
        recentGames
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get deck statistics
// @route   GET /stats/deck/:id
// @access  Private
router.get('/deck/:id', protect, async (req, res, next) => {
  try {
    const deckId = req.params.id;

    // Validate deck exists
    const deck = await Deck.findById(deckId).populate('owner', 'name nickname');
    if (!deck) {
      return res.status(404).json({
        success: false,
        message: 'Deck not found'
      });
    }

    // Get all games for this deck
    const games = await Game.find({ 'players.deck': deckId })
      .populate('players.player', 'name nickname')
      .sort({ date: -1 });

    // Calculate statistics
    const totalGames = games.length;
    const wins = games.filter(game => 
      game.players.find(p => p.deck.toString() === deckId && p.placement === 1)
    ).length;
    const winRate = totalGames > 0 ? (wins / totalGames * 100).toFixed(2) : 0;

    // Calculate average placement
    const placements = games.map(game => 
      game.players.find(p => p.deck.toString() === deckId).placement
    );
    const averagePlacement = totalGames > 0 ? 
      (placements.reduce((sum, placement) => sum + placement, 0) / totalGames).toFixed(2) : 0;

    // Get recent games (last 10)
    const recentGames = games.slice(0, 10).map(game => {
      const deckPlayer = game.players.find(p => p.deck.toString() === deckId);
      return {
        _id: game._id,
        date: game.date,
        placement: deckPlayer.placement,
        player: deckPlayer.player,
        playerCount: game.players.length
      };
    });

    // Calculate placement distribution
    const placementDistribution = {};
    placements.forEach(placement => {
      placementDistribution[placement] = (placementDistribution[placement] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        deck: {
          _id: deck._id,
          name: deck.name,
          commander: deck.commander,
          deckImage: deck.deckImage,
          colorIdentity: deck.colorIdentity,
          tags: deck.tags,
          owner: deck.owner
        },
        statistics: {
          totalGames,
          wins,
          winRate: parseFloat(winRate),
          averagePlacement: parseFloat(averagePlacement),
          placementDistribution
        },
        recentGames
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get global statistics
// @route   GET /stats/global
// @access  Private
router.get('/global', protect, async (req, res, next) => {
  try {
    // Get total counts
    const totalPlayers = await Player.countDocuments();
    const totalDecks = await Deck.countDocuments();
    const totalGames = await Game.countDocuments();

    // Get most active players (by games played)
    const playerStats = await Game.aggregate([
      { $unwind: '$players' },
      {
        $group: {
          _id: '$players.player',
          gamesPlayed: { $sum: 1 },
          wins: {
            $sum: {
              $cond: [{ $eq: ['$players.placement', 1] }, 1, 0]
            }
          },
          totalPlacement: { $sum: '$players.placement' }
        }
      },
      {
        $addFields: {
          winRate: {
            $multiply: [
              { $divide: ['$wins', '$gamesPlayed'] },
              100
            ]
          },
          averagePlacement: {
            $divide: ['$totalPlacement', '$gamesPlayed']
          }
        }
      },
      { $sort: { gamesPlayed: -1 } },
      { $limit: 10 }
    ]);

    // Populate player info
    await Player.populate(playerStats, {
      path: '_id',
      select: 'name nickname profileImage'
    });

    // Get most used decks
    const deckStats = await Game.aggregate([
      { $unwind: '$players' },
      {
        $group: {
          _id: '$players.deck',
          gamesPlayed: { $sum: 1 },
          wins: {
            $sum: {
              $cond: [{ $eq: ['$players.placement', 1] }, 1, 0]
            }
          }
        }
      },
      {
        $addFields: {
          winRate: {
            $multiply: [
              { $divide: ['$wins', '$gamesPlayed'] },
              100
            ]
          }
        }
      },
      { $sort: { gamesPlayed: -1 } },
      { $limit: 10 }
    ]);

    // Populate deck info
    await Deck.populate(deckStats, {
      path: '_id',
      select: 'name commander deckImage owner',
      populate: {
        path: 'owner',
        select: 'name nickname'
      }
    });

    // Get most popular commanders
    const commanderStats = await Deck.aggregate([
      {
        $group: {
          _id: '$commander',
          deckCount: { $sum: 1 }
        }
      },
      { $sort: { deckCount: -1 } },
      { $limit: 10 }
    ]);

    // Get recent activity (last 10 games)
    const recentGames = await Game.find()
      .populate('createdBy', 'name nickname')
      .populate('players.player', 'name nickname')
      .populate('players.deck', 'name commander')
      .sort({ date: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalPlayers,
          totalDecks,
          totalGames
        },
        topPlayers: playerStats.map(stat => ({
          player: stat._id,
          gamesPlayed: stat.gamesPlayed,
          wins: stat.wins,
          winRate: Math.round(stat.winRate * 100) / 100,
          averagePlacement: Math.round(stat.averagePlacement * 100) / 100
        })),
        topDecks: deckStats.map(stat => ({
          deck: stat._id,
          gamesPlayed: stat.gamesPlayed,
          wins: stat.wins,
          winRate: Math.round(stat.winRate * 100) / 100
        })),
        popularCommanders: commanderStats,
        recentGames
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;