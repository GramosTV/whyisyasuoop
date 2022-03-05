const fetch = require('node-fetch');
const NOT_AVAILABLE_IN_API = {
    passiveShield: 525,
    yasuoCritDowngrade: 0.9
}
const {passiveShield, yasuoCritDowngrade} = NOT_AVAILABLE_IN_API
class Yasuo {
    constructor(version) {
        this.version = version
    }

    async getYasuoData() {
        try {
            const championFetch = await fetch(`http://ddragon.leagueoflegends.com/cdn/${this.version}/data/en_US/championFull.json`);
            const championData = await championFetch.json()
            const yasuoData = championData.data.Yasuo
            this.yasuoData = yasuoData
            return yasuoData
        }
        catch (err) {
            console.log(err)
        }
    }
}
class YasuoStatCalculator {
    constructor(data, bestItems) {
        this.stats = data.stats;
        this.bestItems = bestItems
        this.attackspeed = 0.679;
        this.attackDamage = this.stats.attackdamage;
        this.health = this.stats.hp

    }
    calcAttackSpeed() {
        for (let i = 0; i < 16; i++) {
            // console.log(this.attackspeed)
            this.attackspeed = (((this.stats.attackspeedperlevel * this.attackspeed) / 100) + 1) * this.attackspeed
        }
        console.log(this.attackspeed)
        return this.attackspeed
    }
    calcAttackDamage() {
        for (let i = 0; i < 17; i++) {
            this.attackDamage = this.attackDamage += this.stats.attackdamageperlevel
        }
        return this.attackDamage
    }
    calcHealth() {
        for (let i = 0; i < 17; i++) {
            this.health = this.health += this.stats.hpperlevel
        }
        console.log('health: ' + this.health)
        return this.health
    }
    calcWithItems() {
        const damage = this.bestItems.map(e => e[1].stats.FlatPhysicalDamageMod).reduce((a, b) => a + b, 0)
        let yasuoDamage = this.attackDamage + damage
        let krakenPercent = 0
        let krakenPassiveDmg = 0
        let krakenPassivePercent = 0
        let shieldbowShiled = 0
        let shieldbowBonusHealth = 0
        let shieldbowBonusDamage = 0
        let infinityEdgeCritBonus = 0
        let yasuoTrueDmg = 0
        let bonusDmgGlobal = 0
        const critChance = this.bestItems.map(e => e[1].stats.FlatCritChanceMod).reduce((a, b) => a + b, 0)
        const lifeSteal = this.bestItems.map(e => e[1].stats.PercentLifeStealMod).reduce((a, b) => a + b, 0)
        const infnitiyEdgeBonus = () => {
            if (this.bestItems.filter(e => e[1].name === "Infinity Edge")[0] !== undefined) {
                const infinityEdge = this.bestItems.filter(e => e[1].name === "Infinity Edge")[0][1].description
                if (infinityEdge) {
                    infinityEdgeCritBonus = Number(infinityEdge.substring(
                        infinityEdge.lastIndexOf("gain") + 4,
                        infinityEdge.lastIndexOf("% Critical Strike Damage")
                    ))/100 + 1
                    console.log(infinityEdgeCritBonus)
                }
            }
        }
        infnitiyEdgeBonus()
        const calcYasDamage = () => {
            const crit = (critChance + critChance * 1.5)
            let bonusDmg
            let critDecimal
            if (crit > 1) {
                critDecimal = Math.floor((crit - 1) * 10);
                bonusDmg = critDecimal * 10 * 0.4
            }
            bonusDmgGlobal = yasuoDamage += bonusDmg
            yasuoDamage = yasuoDamage + Math.floor(Math.floor(yasuoDamage * 0.75 * yasuoCritDowngrade) * infinityEdgeCritBonus)
        }
        calcYasDamage()
        const krakenBonus = () => {
            if (this.bestItems.filter(e => e[1].name === "Kraken Slayer")[0] !== undefined) {
                const kraken = this.bestItems.filter(e => e[1].name === "Kraken Slayer")[0][1].description
                if (kraken) {
                    krakenPercent = kraken.substring(
                        kraken.lastIndexOf("<attention>") + 1,
                        kraken.lastIndexOf("%</attention> Attack Speed.</mainText><br>")
                    ).replace(/^\D+/g, '') / 100 * (this.bestItems.length - 1)
                    krakenPassiveDmg = kraken.substring(
                        kraken.lastIndexOf("(") + 1,
                        kraken.lastIndexOf("bonus Attack Damage)")
                    ).slice(0, 2)
                    krakenPassivePercent = kraken.substring(
                        kraken.lastIndexOf("+ ") + 2,
                        kraken.lastIndexOf("bonus Attack Damage)")
                    ).slice(0, 2)/100
                    console.log({
                        krakenPassiveDmg,
                        Dmg: yasuoDamage - this.attackDamage,
                        krakenPassivePercent
                    })
                    yasuoTrueDmg =  Number(krakenPassiveDmg) + ((bonusDmgGlobal  - this.attackDamage) * Number(krakenPassivePercent))
                }
            }
        }
        const shieldbowBonus = () => {
            if (this.bestItems.filter(e => e[1].name === "Immortal Shieldbow")[0] !== undefined) {
                const shieldbow = this.bestItems.filter(e => e[1].name === "Immortal Shieldbow")[0][1].description
                if (shieldbow) {
                    shieldbowShiled = Number(shieldbow.substring(
                        shieldbow.lastIndexOf(" - ") + 3,
                        shieldbow.lastIndexOf(" Shield</shield>"))
                    )
                    shieldbowBonusHealth = Number(shieldbow.substring(
                        shieldbow.lastIndexOf("<attention>") + 11,
                        shieldbow.lastIndexOf("</attention> Health."))) * (this.bestItems.length - 1)
                    shieldbowBonusDamage =  Number(shieldbow.substring(
                        shieldbow.lastIndexOf("</rarityLegendary> items <attention>") + 36,
                        shieldbow.lastIndexOf("</attention> Attack Damage"))) * (this.bestItems.length - 1)
                    yasuoDamage += shieldbowBonusDamage
                }
            }
        }
        krakenBonus()
        shieldbowBonus()
        const attackSpeed = ((this.bestItems.map(e => e[1].stats.PercentAttackSpeedMod).reduce((a, b) => a + b, 0) + krakenPercent) * 0.670) + this.attackspeed
        const getPassiveShield = () => {

        }
        this.itemIds = this.bestItems.map(e => e[0])

        return {
            itemIds: this.itemIds,
            yasuoDamage,
            yasuoHealth: this.health + shieldbowBonusHealth,
            yasuoCritChance: critChance,
            yasuoAttackSpeed: Math.round(attackSpeed * 100) / 100,
            yasuoLifeSteal: Math.floor(lifeSteal * 100) + '%',
            yasuoLifeStealPerHit: Math.floor(lifeSteal * yasuoDamage),
            yasuoTrueDamage: yasuoTrueDmg,
            yasuoDps: Math.floor(attackSpeed * yasuoDamage),
            yasuoLifeStealPerSecond:  Math.round((attackSpeed * yasuoDamage) * lifeSteal),
            yasuoPassiveShield: passiveShield,
            immortalShieldbowShield: shieldbowShiled,
            totalShield: passiveShield + shieldbowShiled,
            krakenDps: Math.floor(yasuoTrueDmg / 3),
            completeHealIn: 0
        }
    }
    calcAll() {
        this.calcAttackSpeed();
        this.calcAttackDamage();
        this.calcHealth()
        return this.calcWithItems()
    }
}
class ItemCalculator {
    constructor(version) {
    this.version = version
    }
    async getItemData() {
        try {
            const itemFetch = await fetch(`http://ddragon.leagueoflegends.com/cdn/${this.version}/data/en_US/item.json`);
            const itemToJSON = await itemFetch.json()
            this.itemData = itemToJSON
            return itemToJSON
        }
        catch (err) {
            console.log(err)
        }
    }
    noErrorStats(a, b) {
        if (!a[1].stats.FlatCritChanceMod) {
            a[1].stats.FlatCritChanceMod = 0
        }
        if (!b[1].stats.FlatCritChanceMod) {
            b[1].stats.FlatCritChanceMod = 0
        }
        if (!a[1].stats.PercentAttackSpeedMod) {
            a[1].stats.PercentAttackSpeedMod = 0
        }
        if (!b[1].stats.PercentAttackSpeedMod) {
            b[1].stats.PercentAttackSpeedMod = 0
        }
        if (!a[1].stats.PercentLifeStealMod) {
            a[1].stats.PercentLifeStealMod = 0
        }
        if (!b[1].stats.PercentLifeStealMod) {
            b[1].stats.PercentLifeStealMod = 0
        }
    }
    async getBestItems() {
        await this.getItemData()
        const itemData = this.itemData.data
        const itemArray = Object.entries(itemData)
        const damageItems = itemArray.filter(e => e[1].stats.FlatPhysicalDamageMod && e[1].name !== 'The Golden Spatula')
        const lifeStealItems = itemArray.filter(e => e[1].stats.FlatPhysicalDamageMod && e[1].name !== 'The Golden Spatula')
        const bestDamageMythics = damageItems.sort((a, b) => {
            this.noErrorStats(a, b)
            const aStats = a[1].stats.FlatPhysicalDamageMod + a[1].stats.FlatCritChanceMod + a[1].stats.PercentAttackSpeedMod
            const bStats = b[1].stats.FlatPhysicalDamageMod + b[1].stats.FlatCritChanceMod + b[1].stats.PercentAttackSpeedMod

        if (aStats > bStats) {
            return -1
        }
        if (aStats < bStats) {
            return 1
        }
        if (aStats === bStats) {
            return 0
        }
        })
        const bestLifeStealMythics = lifeStealItems.sort((a, b) => {
            this.noErrorStats(a, b)
            const aStats = a[1].stats.FlatPhysicalDamageMod + a[1].stats.FlatCritChanceMod + a[1].stats.PercentAttackSpeedMod + a[1].stats.PercentLifeStealMod * 200
            const bStats = b[1].stats.FlatPhysicalDamageMod + b[1].stats.FlatCritChanceMod + b[1].stats.PercentAttackSpeedMod + b[1].stats.PercentLifeStealMod * 200

            if (aStats > bStats) {
                return -1
            }
            if (aStats < bStats) {
                return 1
            }
            if (aStats === bStats) {
                return 0
            }
        })

        let mythicFlagDmg = true
        let mythicFlagLs = true
        const bestDamageOneMythic = bestDamageMythics.filter(e => {
            if (!(e[1].description.includes('Mythic'))) {
                return e
            } else if (mythicFlagDmg) {
                mythicFlagDmg = false
                return e
            } else {
                return false
            }
        })
        const bestLifeStealOneMythic = bestLifeStealMythics.filter(e => {
            if (!(e[1].description.includes('Mythic'))) {
                return e
            } else if (mythicFlagLs) {
                mythicFlagLs = false
                return e
            } else {
                return false
            }
        })
        this.bestDamageItems = bestDamageOneMythic.slice(0, 6);
        this.bestLifeStealItems = bestLifeStealOneMythic.slice(0, 6);
        // console.log(this.bestDamageItems);
        return {bestDamageItems: this.bestDamageItems, bestLifeStealItems: this.bestLifeStealItems}
    }
}

module.exports = {
    Yasuo,
    YasuoStatCalculator,
    ItemCalculator
}