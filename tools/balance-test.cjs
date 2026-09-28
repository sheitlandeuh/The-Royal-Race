// Test d'équilibrage (nécessite Playwright) : node tools/balance-test.cjs — le jeu doit être servi sur http://localhost:8765
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:800,height:500}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('trr.champion',JSON.stringify({name:'Éclair de Lune',coat:'alezan',main:'#c21c27',second:'#f4f2ec',pattern:'chevrons',cap:'#f4f2ec'}))});
await p.goto('http://localhost:8765/index.html');await p.waitForTimeout(2500);
// le bot de la console (tools/balance-bot.js) fait les courses : un seul code pour le placement et le sprint d'un bon joueur
const res=await p.evaluate(async()=>{await import('./tools/balance-bot.js');career.data.stats.races=10;const out={};
 for(const m of ['m1','m2','m3'])Object.assign(out,Object.fromEntries(Object.entries(bot.tactics(m,20,bot.smart)).map(([k,v])=>[`${m} ${k}`,v])));
 return out});
console.log(JSON.stringify(res,null,1));console.log(errs);await b.close()})();
