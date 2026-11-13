// Opposito: the nine skins. Every icon is an original flat SVG drawn here (viewBox 100x100).
(function () {
  'use strict';
  const OP = window.OP;

  const rot = (n, step, f) => { let s = ''; for (let k = 0; k < n; k++) s += f(k * step); return s; };

  const ICONS = {
    fire:
      '<path d="M50 5C59 20 78 31 79 56C80 77 66 93 50 93C33 93 20 80 21 60C22 46 30 38 35 29C37 39 41 44 45 46C42 31 44 17 50 5Z" fill="#FF6A45"/>' +
      '<path d="M51 40C58 51 66 58 65 71C64 82 58 89 50 89C42 89 36 82 36 73C36 64 43 58 46 50C47 55 49 57 52 58C50 52 49 46 51 40Z" fill="#FFA24C"/>' +
      '<path d="M50 62C54 68 58 72 57 78C57 84 54 87 50 87C46 87 43 84 43 79C43 74 47 71 50 62Z" fill="#FFE08A"/>',
    ice:
      '<g stroke="#3FA4E8" stroke-width="7.5" stroke-linecap="round" fill="none">' +
      rot(6, 60, (a) => '<g transform="rotate(' + a + ' 50 50)"><path d="M50 50V9"/><path d="M50 23L40 14M50 23L60 14"/><path d="M50 36L42 30M50 36L58 30"/></g>') +
      '</g><circle cx="50" cy="50" r="9" fill="#8FD0F7"/><circle cx="50" cy="50" r="4" fill="#fff"/>',

    cat:
      '<path d="M17 46L22 8L46 30Z" fill="#F08A34"/><path d="M83 46L78 8L54 30Z" fill="#F08A34"/>' +
      '<path d="M23 34L26 17L38 29Z" fill="#FFC1A6"/><path d="M77 34L74 17L62 29Z" fill="#FFC1A6"/>' +
      '<ellipse cx="50" cy="57" rx="37" ry="32" fill="#F59E42"/>' +
      '<ellipse cx="50" cy="70" rx="17" ry="12" fill="#FFE6CF"/>' +
      '<ellipse cx="36" cy="54" rx="5" ry="7" fill="#2E2A33"/><ellipse cx="64" cy="54" rx="5" ry="7" fill="#2E2A33"/>' +
      '<circle cx="37.5" cy="51.5" r="1.8" fill="#fff"/><circle cx="65.5" cy="51.5" r="1.8" fill="#fff"/>' +
      '<path d="M45 64H55L50 70Z" fill="#F0708A"/>' +
      '<path d="M16 64L32 66M16 72L32 70M84 64L68 66M84 72L68 70" stroke="#C46E24" stroke-width="2" stroke-linecap="round"/>',
    dog:
      '<ellipse cx="50" cy="52" rx="31" ry="33" fill="#B57A4C"/>' +
      '<ellipse cx="20" cy="46" rx="12" ry="25" transform="rotate(18 20 46)" fill="#6E4A2E"/>' +
      '<ellipse cx="80" cy="46" rx="12" ry="25" transform="rotate(-18 80 46)" fill="#6E4A2E"/>' +
      '<ellipse cx="50" cy="69" rx="18" ry="14" fill="#F1DCC4"/>' +
      '<ellipse cx="39" cy="47" rx="4.8" ry="6" fill="#2E2A33"/><ellipse cx="61" cy="47" rx="4.8" ry="6" fill="#2E2A33"/>' +
      '<circle cx="40.5" cy="45" r="1.7" fill="#fff"/><circle cx="62.5" cy="45" r="1.7" fill="#fff"/>' +
      '<ellipse cx="50" cy="62" rx="7.5" ry="5.5" fill="#2E2A33"/>' +
      '<path d="M50 67V72M44 74Q50 78 56 74" stroke="#2E2A33" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M46 76Q50 86 54 76Z" fill="#F0708A"/>',

    sun:
      rot(8, 45, (a) => '<rect x="46" y="4" width="8" height="17" rx="4" fill="#FFB020" transform="rotate(' + a + ' 50 50)"/>') +
      '<circle cx="50" cy="50" r="24" fill="#FFC23D"/><circle cx="50" cy="50" r="17" fill="#FFD66B"/>' +
      '<circle cx="43" cy="43" r="5" fill="#FFF1C2"/>',
    moon:
      '<path d="M62 8A43 43 0 1 0 92 68A34 34 0 1 1 62 8Z" fill="#6C72E0"/>' +
      '<path d="M56 16A36 36 0 0 0 26 72" stroke="#9EA3F0" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.7"/>' +
      '<circle cx="38" cy="58" r="4" fill="#5157C4"/><circle cx="52" cy="76" r="3" fill="#5157C4"/>' +
      '<path d="M80 22L82 28L88 30L82 32L80 38L78 32L72 30L78 28Z" fill="#B9BDF7"/>',

    pizza:
      '<path d="M15 24Q50 10 85 24L50 94Z" fill="#FFCB4E"/>' +
      '<path d="M12 20Q50 4 88 20L85 30Q50 16 15 30Z" fill="#D9853A"/>' +
      '<circle cx="39" cy="38" r="7.5" fill="#E04A3A"/><circle cx="61" cy="45" r="6.5" fill="#E04A3A"/><circle cx="49" cy="65" r="6" fill="#E04A3A"/>' +
      '<circle cx="37" cy="36" r="2" fill="#F07A6A"/><circle cx="59" cy="43" r="1.8" fill="#F07A6A"/>' +
      '<path d="M66 32Q70 36 68 40M40 52Q44 54 43 58" stroke="#6BAF3C" stroke-width="3" stroke-linecap="round" fill="none"/>',
    burger:
      '<path d="M13 47Q13 13 50 13Q87 13 87 47Z" fill="#EBA046"/>' +
      '<ellipse cx="36" cy="27" rx="3" ry="1.8" fill="#FFF3D9"/><ellipse cx="52" cy="22" rx="3" ry="1.8" fill="#FFF3D9"/><ellipse cx="64" cy="31" rx="3" ry="1.8" fill="#FFF3D9"/><ellipse cx="46" cy="36" rx="3" ry="1.8" fill="#FFF3D9"/>' +
      '<path d="M11 50Q17 45 23 50T35 50T47 50T59 50T71 50T83 50T91 50V56H11Z" fill="#6CC24A"/>' +
      '<rect x="12" y="55" width="76" height="15" rx="7.5" fill="#7A4528"/>' +
      '<path d="M18 55H82L70 64Z" fill="#FFD23F"/>' +
      '<rect x="14" y="71" width="72" height="16" rx="8" fill="#E39540"/>',

    ninja:
      '<circle cx="50" cy="52" r="38" fill="#323A4D"/>' +
      '<rect x="18" y="41" width="64" height="20" rx="10" fill="#F2C9A0"/>' +
      '<path d="M30 49Q38 44 45 50Q38 54 30 49Z" fill="#232836"/><path d="M70 49Q62 44 55 50Q62 54 70 49Z" fill="#232836"/>' +
      '<rect x="14" y="27" width="72" height="8" rx="4" fill="#E5484D"/>' +
      '<path d="M84 31L97 23L94 34ZM84 31L96 42L88 44Z" fill="#E5484D"/>' +
      '<path d="M36 22Q50 16 64 22" stroke="#4A5470" stroke-width="3" fill="none" stroke-linecap="round"/>',
    pirate:
      '<circle cx="50" cy="58" r="32" fill="#F2C9A0"/>' +
      '<path d="M16 54Q16 18 50 18Q84 18 84 54Z" fill="#E5484D"/>' +
      '<path d="M82 40L96 50L86 56Z" fill="#C93A40"/>' +
      '<circle cx="34" cy="32" r="3" fill="#fff"/><circle cx="50" cy="27" r="3" fill="#fff"/><circle cx="66" cy="33" r="3" fill="#fff"/><circle cx="42" cy="42" r="2.4" fill="#fff"/><circle cx="60" cy="43" r="2.4" fill="#fff"/>' +
      '<path d="M20 52L80 70" stroke="#232836" stroke-width="3"/>' +
      '<ellipse cx="62" cy="64" rx="9" ry="8" fill="#232836"/>' +
      '<circle cx="38" cy="62" r="4.5" fill="#232836"/><circle cx="39.5" cy="60.5" r="1.4" fill="#fff"/>' +
      '<path d="M40 77Q50 83 60 77" stroke="#9A5A3C" stroke-width="3" fill="none" stroke-linecap="round"/>',

    robot:
      '<path d="M50 24V12" stroke="#7F8FA6" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="10" r="6" fill="#FF6A6A"/>' +
      '<rect x="8" y="46" width="10" height="20" rx="4" fill="#6A7A92"/><rect x="82" y="46" width="10" height="20" rx="4" fill="#6A7A92"/>' +
      '<rect x="16" y="24" width="68" height="62" rx="16" fill="#9AA8BC"/>' +
      '<rect x="25" y="36" width="50" height="30" rx="9" fill="#2E3A4E"/>' +
      '<circle cx="40" cy="51" r="6" fill="#5FE0F0"/><circle cx="60" cy="51" r="6" fill="#5FE0F0"/>' +
      '<rect x="36" y="73" width="28" height="5" rx="2.5" fill="#6A7A92"/>',
    alien:
      '<path d="M50 9C77 9 89 30 87 50C85 72 65 93 50 93C35 93 15 72 13 50C11 30 23 9 50 9Z" fill="#6DD46A"/>' +
      '<ellipse cx="35" cy="53" rx="11" ry="15" transform="rotate(-28 35 53)" fill="#1E2A22"/>' +
      '<ellipse cx="65" cy="53" rx="11" ry="15" transform="rotate(28 65 53)" fill="#1E2A22"/>' +
      '<ellipse cx="32" cy="48" rx="3" ry="4" fill="#fff" opacity="0.85"/><ellipse cx="62" cy="48" rx="3" ry="4" fill="#fff" opacity="0.85"/>' +
      '<path d="M44 78Q50 81 56 78" stroke="#2F7A35" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="38" cy="22" rx="8" ry="4" fill="#A3E89A" opacity="0.8"/>',

    cactus:
      '<rect x="39" y="12" width="22" height="62" rx="11" fill="#3FAE6A"/>' +
      '<rect x="22" y="44" width="22" height="11" rx="5.5" fill="#3FAE6A"/><rect x="22" y="28" width="11" height="26" rx="5.5" fill="#3FAE6A"/>' +
      '<rect x="56" y="50" width="22" height="11" rx="5.5" fill="#3FAE6A"/><rect x="67" y="34" width="11" height="26" rx="5.5" fill="#3FAE6A"/>' +
      '<path d="M50 20V66" stroke="#2E8F54" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M44 26l-3-2M56 34l3-2M44 46l-3-2M56 58l3-2" stroke="#E6F7D9" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="50" cy="12" r="5" fill="#FF7EB6"/>' +
      '<rect x="24" y="68" width="52" height="10" rx="4" fill="#D9774B"/>' +
      '<path d="M29 77H71L66 94H34Z" fill="#C4633A"/>',
    flower:
      '<path d="M50 56V94" stroke="#3FAE6A" stroke-width="6" stroke-linecap="round"/>' +
      '<ellipse cx="62" cy="78" rx="11" ry="5.5" transform="rotate(-30 62 78)" fill="#3FAE6A"/>' +
      rot(6, 60, (a) => '<ellipse cx="50" cy="22" rx="11" ry="16" fill="#F06EAA" transform="rotate(' + a + ' 50 40)"/>') +
      '<circle cx="50" cy="40" r="11" fill="#FFD166"/><circle cx="47" cy="37" r="3.5" fill="#FFE9A8"/>',

    coffee:
      '<path d="M40 8Q34 14 40 20T40 30M54 8Q48 14 54 20T54 30" stroke="#C9B3A2" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<path d="M70 46H76Q88 46 88 58Q88 70 76 70H70" stroke="#9A5B36" stroke-width="7" fill="none"/>' +
      '<rect x="16" y="34" width="58" height="56" rx="12" fill="#A9653D"/>' +
      '<ellipse cx="45" cy="38" rx="25" ry="5" fill="#5A3320"/>' +
      '<path d="M24 52V78" stroke="#C17E52" stroke-width="5" stroke-linecap="round"/>',
    tea:
      '<path d="M66 44H72Q84 44 84 54Q84 64 72 64H64" stroke="#2F9C78" stroke-width="6" fill="none"/>' +
      '<path d="M12 40H76Q74 76 44 82Q14 76 12 40Z" fill="#3FB28A"/>' +
      '<ellipse cx="44" cy="40" rx="32" ry="5" fill="#B8E3C6"/>' +
      '<ellipse cx="44" cy="87" rx="38" ry="6" fill="#2F9C78"/>' +
      '<path d="M30 40V22" stroke="#B0896A" stroke-width="2" /><rect x="23" y="12" width="14" height="12" rx="2" fill="#FFD166"/>' +
      '<path d="M28 18H32" stroke="#D9A43A" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M22 50Q24 64 32 70" stroke="#7FD3B0" stroke-width="4" fill="none" stroke-linecap="round"/>',

    sword:
      '<g transform="rotate(45 50 50)">' +
      '<path d="M45 18L50 4L55 18V64H45Z" fill="#C3CEDB"/><path d="M50 8V62" stroke="#E8EEF5" stroke-width="2.5"/>' +
      '<rect x="31" y="62" width="38" height="9" rx="4.5" fill="#E8A93A"/>' +
      '<rect x="45.5" y="71" width="9" height="17" rx="3" fill="#6B4A3A"/>' +
      '<circle cx="50" cy="92" r="5.5" fill="#E8A93A"/></g>',
    shield:
      '<path d="M50 6L86 19L82 56Q76 81 50 94Q24 81 18 56L14 19Z" fill="#F2C14E"/>' +
      '<path d="M50 14L78 24L75 54Q70 74 50 85Q30 74 25 54L22 24Z" fill="#3D7DD8"/>' +
      '<path d="M50 30L55 42L68 43L58 51L62 64L50 57L38 64L42 51L32 43L45 42Z" fill="#fff"/>',
  };

  function svg(inner, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + (size || 256) + '" height="' + (size || 256) + '">' + inner + '</svg>';
  }

  // a / b: piece colours (glows, link halves, tints). bg: card backdrop.
  const LIST = [
    { id: 'fireice', name: 'Fire & Ice', pa: 'fire', pb: 'ice', an: 'Fire', bn: 'Ice', a: '#FF6A45', b: '#3FA4E8', bg: ['#FFF1EA', '#EAF5FD'], unlock: { type: 'default' } },
    { id: 'catdog', name: 'Cat & Dog', pa: 'cat', pb: 'dog', an: 'Cat', bn: 'Dog', a: '#F59E42', b: '#8A5A36', bg: ['#FFF3E5', '#F4EAE1'], unlock: { type: 'login', day: 2 } },
    { id: 'sunmoon', name: 'Sun & Moon', pa: 'sun', pb: 'moon', an: 'Sun', bn: 'Moon', a: '#FFB020', b: '#6C72E0', bg: ['#FFF7E0', '#ECEDFD'], unlock: { type: 'ad' } },
    { id: 'pizzaburger', name: 'Pizza & Burger', pa: 'pizza', pb: 'burger', an: 'Pizza', bn: 'Burger', a: '#E04A3A', b: '#B86A2E', bg: ['#FFF0E8', '#FBF0E2'], unlock: { type: 'coins', price: 500 } },
    { id: 'ninjapirate', name: 'Ninja & Pirate', pa: 'ninja', pb: 'pirate', an: 'Ninja', bn: 'Pirate', a: '#323A4D', b: '#E5484D', bg: ['#ECEEF3', '#FDECEC'], unlock: { type: 'login', day: 6 } },
    { id: 'robotalien', name: 'Robot & Alien', pa: 'robot', pb: 'alien', an: 'Robot', bn: 'Alien', a: '#6A7A92', b: '#4CB84A', bg: ['#EEF1F6', '#EBF8EA'], unlock: { type: 'coins', price: 650 } },
    { id: 'cactusflower', name: 'Cactus & Flower', pa: 'cactus', pb: 'flower', an: 'Cactus', bn: 'Flower', a: '#2E9C5C', b: '#E85A9C', bg: ['#EAF6EE', '#FDEDF5'], unlock: { type: 'coins', price: 400 } },
    { id: 'coffeetea', name: 'Coffee & Tea', pa: 'coffee', pb: 'tea', an: 'Coffee', bn: 'Tea', a: '#9A5B36', b: '#2F9C78', bg: ['#F7EEE8', '#E8F6F0'], unlock: { type: 'coins', price: 300 } },
    { id: 'swordshield', name: 'Sword & Shield', pa: 'sword', pb: 'shield', an: 'Sword', bn: 'Shield', a: '#7D8DA3', b: '#3D7DD8', bg: ['#EEF1F5', '#EAF1FC'], unlock: { type: 'coins', price: 800 } },
  ];

  const byId = {};
  LIST.forEach((s) => { byId[s.id] = s; });

  OP.skins = {
    list: LIST,
    get(id) { return byId[id] || LIST[0]; },
    icon(name, size) { return svg(ICONS[name], size); },
    dataUri(name, size) { return 'data:image/svg+xml;base64,' + btoa(svg(ICONS[name], size)); },
  };
})();
