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
      if (placement && !isNaN(placement)) {
        placementDistribution[placement] = (placementDistribution[placement] || 0) + 1;
      }
    });

    // Calculate player vs player matchup data
    const playerMatchups = {};
    games.forEach(game => {
      const thisPlayer = game.players.find(p => p.player.toString() === playerId);
      const otherPlayers = game.players.filter(p => p.player.toString() !== playerId);
      
      otherPlayers.forEach(opponent => {
        const opponentId = opponent.player.toString();
        if (!playerMatchups[opponentId]) {
          playerMatchups[opponentId] = {
            opponent: null, // Will be populated later
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            averagePositionDifference: 0,
            positionDifferences: [],
            headToHeadWins: 0 // Direct 1v1 placement comparison
          };
        }
        
        playerMatchups[opponentId].gamesPlayed++;
        const positionDiff = opponent.placement - thisPlayer.placement;
        playerMatchups[opponentId].positionDifferences.push(positionDiff);
        
        if (thisPlayer.placement < opponent.placement) {
          playerMatchups[opponentId].wins++;
          playerMatchups[opponentId].headToHeadWins++;
        } else if (thisPlayer.placement > opponent.placement) {
          playerMatchups[opponentId].losses++;
        }
      });
    });

    // Calculate averages and populate player info
    const playerMatchupsArray = [];
    for (const [opponentId, matchup] of Object.entries(playerMatchups)) {
      if (matchup.gamesPlayed >= 2) { // Only show matchups with at least 2 games
        const opponent = await Player.findById(opponentId)
          .select('name nickname profileImage');
        
        if (opponent) {
          matchup.opponent = opponent;
          matchup.winRate = matchup.gamesPlayed > 0 ? 
            ((matchup.headToHeadWins / matchup.gamesPlayed) * 100).toFixed(1) : 0;
          matchup.averagePositionDifference = 
            matchup.positionDifferences.length > 0 ?
            (matchup.positionDifferences.reduce((sum, diff) => sum + diff, 0) / matchup.positionDifferences.length).toFixed(1) : 0;
          delete matchup.positionDifferences;
          playerMatchupsArray.push(matchup);
        }
      }
    }

    // Sort by games played, then by win rate
    playerMatchupsArray.sort((a, b) => {
      if (b.gamesPlayed !== a.gamesPlayed) {
        return b.gamesPlayed - a.gamesPlayed;
      }
      return parseFloat(b.winRate) - parseFloat(a.winRate);
    });

    // Calculate elimination statistics
    const eliminationStats = {
      playersEliminated: {}, // Players this player eliminated
      eliminatedBy: {} // Players who eliminated this player
    };

    games.forEach(game => {
      game.players.forEach(gamePlayer => {
        if (gamePlayer.eliminatedBy) {
          const eliminatedPlayerId = gamePlayer.player.toString();
          const eliminatorId = gamePlayer.eliminatedBy.toString();

          // This player eliminated someone
          if (eliminatorId === playerId) {
            if (!eliminationStats.playersEliminated[eliminatedPlayerId]) {
              eliminationStats.playersEliminated[eliminatedPlayerId] = {
                player: null,
                count: 0
              };
            }
            eliminationStats.playersEliminated[eliminatedPlayerId].count++;
          }

          // This player was eliminated by someone
          if (eliminatedPlayerId === playerId) {
            if (!eliminationStats.eliminatedBy[eliminatorId]) {
              eliminationStats.eliminatedBy[eliminatorId] = {
                player: null,
                count: 0
              };
            }
            eliminationStats.eliminatedBy[eliminatorId].count++;
          }
        }
      });
    });

    // Populate player info for elimination stats
    const playersEliminatedArray = [];
    for (const [victimId, data] of Object.entries(eliminationStats.playersEliminated)) {
      const victim = await Player.findById(victimId).select('name nickname profileImage');
      if (victim) {
        playersEliminatedArray.push({
          player: victim,
          count: data.count
        });
      }
    }
    playersEliminatedArray.sort((a, b) => b.count - a.count);

    const eliminatedByArray = [];
    for (const [eliminatorId, data] of Object.entries(eliminationStats.eliminatedBy)) {
      const eliminator = await Player.findById(eliminatorId).select('name nickname profileImage');
      if (eliminator) {
        eliminatedByArray.push({
          player: eliminator,
          count: data.count
        });
      }
    }
    eliminatedByArray.sort((a, b) => b.count - a.count);

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
        matchups: playerMatchupsArray,
        deckUsage: sortedDeckUsage,
        recentGames,
        eliminationStats: {
          playersEliminated: playersEliminatedArray,
          eliminatedBy: eliminatedByArray
        }
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

    // Calculate matchup data against other decks
    const deckMatchups = {};
    games.forEach(game => {
      const thisDeckPlayer = game.players.find(p => p.deck.toString() === deckId);
      const otherDecks = game.players.filter(p => p.deck.toString() !== deckId);
      
      otherDecks.forEach(opponent => {
        const opponentDeckId = opponent.deck.toString();
        if (!deckMatchups[opponentDeckId]) {
          deckMatchups[opponentDeckId] = {
            opponentDeck: null, // Will be populated later
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            averagePositionDifference: 0,
            positionDifferences: []
          };
        }
        
        deckMatchups[opponentDeckId].gamesPlayed++;
        const positionDiff = opponent.placement - thisDeckPlayer.placement;
        deckMatchups[opponentDeckId].positionDifferences.push(positionDiff);
        
        if (thisDeckPlayer.placement < opponent.placement) {
          deckMatchups[opponentDeckId].wins++;
        } else if (thisDeckPlayer.placement > opponent.placement) {
          deckMatchups[opponentDeckId].losses++;
        }
      });
    });

    // Calculate averages and populate deck info
    const deckMatchupsArray = [];
    for (const [opponentDeckId, matchup] of Object.entries(deckMatchups)) {
      if (matchup.gamesPlayed >= 2) { // Only show matchups with at least 2 games
        const opponentDeck = await Deck.findById(opponentDeckId)
          .populate('owner', 'name nickname')
          .select('name commander deckImage colorIdentity owner');
        
        if (opponentDeck) {
          matchup.opponentDeck = opponentDeck;
          matchup.winRate = matchup.gamesPlayed > 0 ? 
            ((matchup.wins / matchup.gamesPlayed) * 100).toFixed(1) : 0;
          matchup.averagePositionDifference = 
            matchup.positionDifferences.length > 0 ?
            (matchup.positionDifferences.reduce((sum, diff) => sum + diff, 0) / matchup.positionDifferences.length).toFixed(1) : 0;
          delete matchup.positionDifferences;
          deckMatchupsArray.push(matchup);
        }
      }
    }

    // Sort by games played, then by win rate
    deckMatchupsArray.sort((a, b) => {
      if (b.gamesPlayed !== a.gamesPlayed) {
        return b.gamesPlayed - a.gamesPlayed;
      }
      return parseFloat(b.winRate) - parseFloat(a.winRate);
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
        matchups: deckMatchupsArray,
        recentGames
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user-specific dashboard statistics
// @route   GET /stats/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Get user's deck stats
    const userDecks = await Deck.find({ owner: userId });
    const userDeckIds = userDecks.map(deck => deck._id);

    // Get user's recent games
    const userRecentGames = await Game.find({ 'players.player': userId })
      .populate('players.player', 'name nickname')
      .populate('players.deck', 'name commander')
      .sort({ date: -1 })
      .limit(5);

    // Get user's top performing decks
    const userDeckStats = await Game.aggregate([
      { $unwind: '$players' },
      { $match: { 'players.deck': { $in: userDeckIds } } },
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
            $cond: [
              { $gt: ['$gamesPlayed', 0] },
              { $multiply: [{ $divide: ['$wins', '$gamesPlayed'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { winRate: -1, gamesPlayed: -1 } },
      { $limit: 5 }
    ]);

    // Populate deck info
    await Deck.populate(userDeckStats, {
      path: '_id',
      select: 'name commander deckImage owner',
      populate: {
        path: 'owner',
        select: 'name nickname'
      }
    });

    // Calculate user's personal win rate
    const userGameStats = await Game.aggregate([
      { $unwind: '$players' },
      { $match: { 'players.player': userId } },
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          wins: {
            $sum: {
              $cond: [{ $eq: ['$players.placement', 1] }, 1, 0]
            }
          }
        }
      }
    ]);

    const userWinRate = userGameStats.length > 0 && userGameStats[0].totalGames > 0 ? 
      Math.round((userGameStats[0].wins / userGameStats[0].totalGames) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        personalStats: {
          totalDecks: userDecks.length,
          totalGames: userGameStats.length > 0 ? userGameStats[0].totalGames : 0,
          wins: userGameStats.length > 0 ? userGameStats[0].wins : 0,
          winRate: userWinRate
        },
        topUserDecks: userDeckStats.map(stat => ({
          _id: stat._id._id,
          name: stat._id.name,
          commander: stat._id.commander,
          deckImage: stat._id.deckImage,
          owner: stat._id.owner,
          gamesPlayed: stat.gamesPlayed,
          wins: stat.wins,
          winRate: Math.round(stat.winRate * 100) / 100
        })),
        recentUserGames: userRecentGames
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
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

    // Calculate average game length
    const gameStatsAgg = await Game.aggregate([
      {
        $match: {
          durationMinutes: { $exists: true, $ne: null, $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          averageDuration: { $avg: '$durationMinutes' },
          count: { $sum: 1 }
        }
      }
    ]);

    const averageGameLength = gameStatsAgg.length > 0 ? Math.round(gameStatsAgg[0].averageDuration) : 0;

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
            $cond: [
              { $gt: ['$gamesPlayed', 0] },
              { $multiply: [{ $divide: ['$wins', '$gamesPlayed'] }, 100] },
              0
            ]
          },
          averagePlacement: {
            $cond: [
              { $gt: ['$gamesPlayed', 0] },
              { $divide: ['$totalPlacement', '$gamesPlayed'] },
              0
            ]
          }
        }
      },
      { $sort: { winRate: -1, gamesPlayed: -1 } },
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
            $cond: [
              { $gt: ['$gamesPlayed', 0] },
              { $multiply: [{ $divide: ['$wins', '$gamesPlayed'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { winRate: -1, gamesPlayed: -1 } },
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

    // Get most popular commanders with win rates
    const commanderStats = await Game.aggregate([
      { $unwind: '$players' },
      {
        $lookup: {
          from: 'decks',
          localField: 'players.deck',
          foreignField: '_id',
          as: 'deckInfo'
        }
      },
      { $unwind: '$deckInfo' },
      {
        $group: {
          _id: '$deckInfo.commander',
          count: { $sum: 1 },
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
            $cond: [
              { $gt: ['$count', 0] },
              { $multiply: [{ $divide: ['$wins', '$count'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get recent activity (last 10 games)
    const recentGames = await Game.find()
      .populate('createdBy', 'name nickname')
      .populate('players.player', 'name nickname')
      .populate('players.deck', 'name commander')
      .sort({ date: -1 })
      .limit(10);

    // Create recent activity feed
    const recentActivity = recentGames.map(game => {
      const winner = game.players.find(p => p.placement === 1);
      return {
        type: 'game',
        description: `${winner?.player.nickname || winner?.player.name || 'Someone'} won with ${winner?.deck.commander || 'their deck'}`,
        date: game.date
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalGames,
        totalPlayers,
        totalDecks,
        averageGameLength,
        topPlayers: playerStats.map(stat => ({
          _id: stat._id._id,
          name: stat._id.name,
          nickname: stat._id.nickname,
          profileImage: stat._id.profileImage,
          gamesPlayed: stat.gamesPlayed,
          wins: stat.wins,
          winRate: Math.round(stat.winRate * 100) / 100,
          averagePlacement: Math.round(stat.averagePlacement * 100) / 100
        })),
        topDecks: deckStats.map(stat => ({
          _id: stat._id._id,
          name: stat._id.name,
          commander: stat._id.commander,
          deckImage: stat._id.deckImage,
          owner: stat._id.owner,
          gamesPlayed: stat.gamesPlayed,
          wins: stat.wins,
          winRate: Math.round(stat.winRate * 100) / 100
        })),
        mostPopularCommanders: commanderStats.map(stat => ({
          commander: stat._id,
          count: stat.count,
          winRate: Math.round(stat.winRate * 100) / 100
        })),
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;