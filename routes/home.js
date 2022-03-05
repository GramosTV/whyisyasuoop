const express = require('express');
const homeRouter = express.Router();
const {Yasuo, YasuoStatCalculator, ItemCalculator} = require('../utils/app')
const fetch = require('node-fetch');
let version = ""
let yas = ''
let itemCalc = ''
const initialize = async () => {
        try {
            const versionFetch = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
            const versionData = await versionFetch.json()
            version = versionData[0]
            yas = new Yasuo(version)
            itemCalc = new ItemCalculator(version)
            return true
        }
        catch (err) {
            console.log(err)
        }
}
homeRouter
    .get('/', async (req, res) => {
    await initialize()
    const yasData = await yas.getYasuoData();
    const bestItems = await itemCalc.getBestItems();
    const yasStatCalcDmg = new YasuoStatCalculator(yasData, bestItems.bestDamageItems);
    const yasStatCalcLs = new YasuoStatCalculator(yasData, bestItems.bestLifeStealItems);
    const dmgStats = await yasStatCalcDmg.calcAll();
    const lsStats = await yasStatCalcLs.calcAll();
    console.log(bestItems.bestDamageItems[0][0])
    res.render('home.hbs' , {
        data: [dmgStats, lsStats]
    })
    })

module.exports = {
    homeRouter,
}