/* LocalPassMass cryptographic password generator shared by popup and page UI. */
(() => {
  if (globalThis.LPM_PASSWORD_GENERATOR) return;
  const SETS = Object.freeze({
    upper:'ABCDEFGHJKLMNPQRSTUVWXYZ',
    lower:'abcdefghijkmnopqrstuvwxyz',
    number:'23456789',
    symbol:'!@#$%^&*()-_=+[]{};:,.?'
  });
  function randomIndex(max) {
    if (!Number.isInteger(max) || max <= 0) return 0;
    // Rejection sampling avoids modulo bias.
    const limit = Math.floor(0x100000000 / max) * max;
    const buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % max;
  }
  function generate(options = {}) {
    const length=Math.max(4,Math.min(128,Number(options.length||20)));
    const enabled=[];
    if(options.upper!==false) enabled.push(SETS.upper);
    if(options.lower!==false) enabled.push(SETS.lower);
    if(options.number!==false) enabled.push(SETS.number);
    if(options.symbol!==false) enabled.push(SETS.symbol);
    if(!enabled.length) enabled.push(SETS.lower,SETS.number);
    const all=enabled.join('');
    const chars=[];
    for(const set of enabled) if(chars.length<length) chars.push(set[randomIndex(set.length)]);
    while(chars.length<length) chars.push(all[randomIndex(all.length)]);
    for(let i=chars.length-1;i>0;i--){const j=randomIndex(i+1);[chars[i],chars[j]]=[chars[j],chars[i]];}
    return chars.join('');
  }
  globalThis.LPM_PASSWORD_GENERATOR=Object.freeze({generate});
})();
