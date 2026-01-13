// data/tourist-attractions/index.js
// Main export file for tourist attractions by province

const samutPrakan = require('./samut-prakan');
const bangkokAttractions = require('./bangkok');
const pathumThani = require('./pathum-thani');
const nonthaburi = require('./nonthaburi');
const ayutthaya = require('./ayutthaya');
const lopburi = require('./lopburi');
const saraburi = require('./saraburi');
const angThong = require('./ang-thong');
const singburi = require('./singburi');
const chainat = require('./chainat');
// Northern provinces
const chiangMai = require('./chiang-mai');
const chiangRai = require('./chiang-rai');
const lampang = require('./lampang');
const lamphun = require('./lamphun');
const nan = require('./nan');
const phayao = require('./phayao');
const phrae = require('./phrae');
const maeHongSon = require('./mae-hong-son');
const uttaradit = require('./uttaradit');
// Additional Northern provinces
const tak = require('./tak');
const sukhothai = require('./sukhothai');
const phitsanulok = require('./phitsanulok');
const pichit = require('./pichit');
const kamphaengPhet = require('./kamphaeng-phet');
const nakhonSawan = require('./nakhon-sawan');
const uthaiThani = require('./uthai-thani');
// Additional Central provinces
const nakhonNayok = require('./nakhon-nayok');
const prachinBuri = require('./prachin-buri');
const saKaeo = require('./sa-kaeo');
const chachoengsao = require('./chachoengsao');
const samutSakhon = require('./samut-sakhon');
const samutSongkhram = require('./samut-songkhram');
const nakhonPathom = require('./nakhon-pathom');
const suphanBuri = require('./suphan-buri');
// Eastern provinces
const chonburi = require('./chonburi');
const rayong = require('./rayong');
const chanthaburi = require('./chanthaburi');
const trat = require('./trat');
// Western provinces
const kanchanaburi = require('./kanchanaburi');
const ratchaburi = require('./ratchaburi');
const phetchaburi = require('./phetchaburi');
const prachuapKhiriKhan = require('./prachuap-khiri-khan');
// Northeastern provinces
const khonKaen = require('./khon-kaen');
const udonThani = require('./udon-thani');
const nakhonRatchasima = require('./nakhon-ratchasima');
const ubonRatchathani = require('./ubon-ratchathani');
const mahasarakham = require('./mahasarakham');
const roiet = require('./roiet');
const kalasin = require('./kalasin');
const sakonNakhon = require('./sakon-nakhon');
const buriram = require('./buriram');
const surin = require('./surin');
const siSaKet = require('./si-sa-ket');
const yasothon = require('./yasothon');
const chaiyaphum = require('./chaiyaphum');
const amnatCharoen = require('./amnat-charoen');
const nongBuaLamphu = require('./nong-bua-lamphu');
const loei = require('./loei');
const nongKhai = require('./nong-khai');
const mukdahan = require('./mukdahan');
const nakhonPhanom = require('./nakhon-phanom');
const buengKan = require('./bueng-kan');
// Southern provinces
const phuket = require('./phuket');
const krabi = require('./krabi');
const phangNga = require('./phang-nga');
const trang = require('./trang');
const songkhla = require('./songkhla');
const nakhonSiThammarat = require('./nakhon-si-thammarat');
const suratThani = require('./surat-thani');
const phatthalung = require('./phatthalung');
const chumphon = require('./chumphon');
const ranong = require('./ranong');
const satun = require('./satun');
const pattani = require('./pattani');
const yala = require('./yala');
const narathiwat = require('./narathiwat');

// Map of province code/name to attraction data
const attractionsByProvince = {
  'สมุทรปราการ': samutPrakan.samutPrakanAttractions,
  'samut-prakan': samutPrakan.samutPrakanAttractions,
  'samutprakan': samutPrakan.samutPrakanAttractions,
  'กรุงเทพมหานคร': bangkokAttractions,
  'กรุงเทพ': bangkokAttractions,
  'bangkok': bangkokAttractions,
  'Bangkok': bangkokAttractions,
  'ปทุมธานี': pathumThani.pathumThaniAttractions,
  'pathum-thani': pathumThani.pathumThaniAttractions,
  'pathumthani': pathumThani.pathumThaniAttractions,
  'นนทบุรี': nonthaburi.nonthaburiAttractions,
  'nonthaburi': nonthaburi.nonthaburiAttractions,
  'พระนครศรีอยุธยา': ayutthaya.ayutthayaAttractions,
  'อยุธยา': ayutthaya.ayutthayaAttractions,
  'ayutthaya': ayutthaya.ayutthayaAttractions,
  'ลพบุรี': lopburi.lopburiAttractions,
  'lopburi': lopburi.lopburiAttractions,
  'สระบุรี': saraburi.saraburiAttractions,
  'saraburi': saraburi.saraburiAttractions,
  'อ่างทอง': angThong.angThongAttractions,
  'ang-thong': angThong.angThongAttractions,
  'angthong': angThong.angThongAttractions,
  'สิงห์บุรี': singburi.singburiAttractions,
  'singburi': singburi.singburiAttractions,
  'ชัยนาท': chainat.chainatAttractions,
  'chainat': chainat.chainatAttractions,
  // Additional Northern provinces
  'ตาก': tak.takAttractions,
  'tak': tak.takAttractions,
  'สุโขทัย': sukhothai.sukhothaiAttractions,
  'sukhothai': sukhothai.sukhothaiAttractions,
  'พิษณุโลก': phitsanulok.phitsanulokAttractions,
  'phitsanulok': phitsanulok.phitsanulokAttractions,
  'พิจิตร': pichit.pichitAttractions,
  'pichit': pichit.pichitAttractions,
  'กำแพงเพชร': kamphaengPhet.kamphaengPhetAttractions,
  'kamphaeng-phet': kamphaengPhet.kamphaengPhetAttractions,
  'kamphaengphet': kamphaengPhet.kamphaengPhetAttractions,
  'นครสวรรค์': nakhonSawan.nakhonSawanAttractions,
  'nakhon-sawan': nakhonSawan.nakhonSawanAttractions,
  'nakhonsawan': nakhonSawan.nakhonSawanAttractions,
  'อุทัยธานี': uthaiThani.uthaiThaniAttractions,
  'uthai-thani': uthaiThani.uthaiThaniAttractions,
  'uthaithani': uthaiThani.uthaiThaniAttractions,
  // Additional Central provinces
  'นครนายก': nakhonNayok.nakhonNayokAttractions,
  'nakhon-nayok': nakhonNayok.nakhonNayokAttractions,
  'nakhonnayok': nakhonNayok.nakhonNayokAttractions,
  'ปราจีนบุรี': prachinBuri.prachinBuriAttractions,
  'prachin-buri': prachinBuri.prachinBuriAttractions,
  'prachinburi': prachinBuri.prachinBuriAttractions,
  'สระแก้ว': saKaeo.saKaeoAttractions,
  'sa-kaeo': saKaeo.saKaeoAttractions,
  'sakaeo': saKaeo.saKaeoAttractions,
  'ฉะเชิงเทรา': chachoengsao.chachoengsaoAttractions,
  'chachoengsao': chachoengsao.chachoengsaoAttractions,
  'สมุทรสาคร': samutSakhon.samutSakhonAttractions,
  'samut-sakhon': samutSakhon.samutSakhonAttractions,
  'samutsakhon': samutSakhon.samutSakhonAttractions,
  'สมุทรสงคราม': samutSongkhram.samutSongkhramAttractions,
  'samut-songkhram': samutSongkhram.samutSongkhramAttractions,
  'samutsongkhram': samutSongkhram.samutSongkhramAttractions,
  'นครปฐม': nakhonPathom.nakhonPathomAttractions,
  'nakhon-pathom': nakhonPathom.nakhonPathomAttractions,
  'nakhonpathom': nakhonPathom.nakhonPathomAttractions,
  'สุพรรณบุรี': suphanBuri.suphanBuriAttractions,
  'suphan-buri': suphanBuri.suphanBuriAttractions,
  'suphanburi': suphanBuri.suphanBuriAttractions,
  // Eastern provinces
  'ชลบุรี': chonburi.chonburiAttractions,
  'chonburi': chonburi.chonburiAttractions,
  'ระยอง': rayong.rayongAttractions,
  'rayong': rayong.rayongAttractions,
  'จันทบุรี': chanthaburi.chanthaburiAttractions,
  'chanthaburi': chanthaburi.chanthaburiAttractions,
  'ตราด': trat.tratAttractions,
  'trat': trat.tratAttractions,
  // Western provinces
  'กาญจนบุรี': kanchanaburi.kanchanaburiAttractions,
  'kanchanaburi': kanchanaburi.kanchanaburiAttractions,
  'ราชบุรี': ratchaburi.ratchaburiAttractions,
  'ratchaburi': ratchaburi.ratchaburiAttractions,
  'เพชรบุรี': phetchaburi.phetchaburiAttractions,
  'phetchaburi': phetchaburi.phetchaburiAttractions,
  'ประจวบคีรีขันธ์': prachuapKhiriKhan.prachuapKhiriKhanAttractions,
  'prachuap-khiri-khan': prachuapKhiriKhan.prachuapKhiriKhanAttractions,
  'prachuapkhirikhan': prachuapKhiriKhan.prachuapKhiriKhanAttractions,
  // Northeastern provinces
  'ขอนแก่น': khonKaen.khonKaenAttractions,
  'khon-kaen': khonKaen.khonKaenAttractions,
  'khonkaen': khonKaen.khonKaenAttractions,
  'อุดรธานี': udonThani.udonThaniAttractions,
  'udon-thani': udonThani.udonThaniAttractions,
  'udonthani': udonThani.udonThaniAttractions,
  'นครราชสีมา': nakhonRatchasima.nakhonRatchasimaAttractions,
  'nakhon-ratchasima': nakhonRatchasima.nakhonRatchasimaAttractions,
  'nakhonratchasima': nakhonRatchasima.nakhonRatchasimaAttractions,
  'อุบลราชธานี': ubonRatchathani.ubonRatchathaniAttractions,
  'ubon-ratchathani': ubonRatchathani.ubonRatchathaniAttractions,
  'ubonratchathani': ubonRatchathani.ubonRatchathaniAttractions,
  'มหาสารคาม': mahasarakham.mahasarakhamAttractions,
  'mahasarakham': mahasarakham.mahasarakhamAttractions,
  'ร้อยเอ็ด': roiet.roietAttractions,
  'roiet': roiet.roietAttractions,
  'roi-et': roiet.roietAttractions,
  'กาฬสินธุ์': kalasin.kalasinAttractions,
  'kalasin': kalasin.kalasinAttractions,
  'สกลนคร': sakonNakhon.sakonNakhonAttractions,
  'sakon-nakhon': sakonNakhon.sakonNakhonAttractions,
  'sakonnakhon': sakonNakhon.sakonNakhonAttractions,
  'บุรีรัมย์': buriram.buriramAttractions,
  'buriram': buriram.buriramAttractions,
  'สุรินทร์': surin.surinAttractions,
  'surin': surin.surinAttractions,
  'ศรีสะเกษ': siSaKet.siSaKetAttractions,
  'si-sa-ket': siSaKet.siSaKetAttractions,
  'sisaket': siSaKet.siSaKetAttractions,
  'ยโสธร': yasothon.yasothonAttractions,
  'yasothon': yasothon.yasothonAttractions,
  'ชัยภูมิ': chaiyaphum.chaiyaphumAttractions,
  'chaiyaphum': chaiyaphum.chaiyaphumAttractions,
  'อำนาจเจริญ': amnatCharoen.amnatCharoenAttractions,
  'amnat-charoen': amnatCharoen.amnatCharoenAttractions,
  'amnatcharoen': amnatCharoen.amnatCharoenAttractions,
  'หนองบัวลำภู': nongBuaLamphu.nongBuaLamphuAttractions,
  'nong-bua-lamphu': nongBuaLamphu.nongBuaLamphuAttractions,
  'nongbualamphu': nongBuaLamphu.nongBuaLamphuAttractions,
  'เลย': loei.loeiAttractions,
  'loei': loei.loeiAttractions,
  'หนองคาย': nongKhai.nongKhaiAttractions,
  'nong-khai': nongKhai.nongKhaiAttractions,
  'nongkhai': nongKhai.nongKhaiAttractions,
  'มุกดาหาร': mukdahan.mukdahanAttractions,
  'mukdahan': mukdahan.mukdahanAttractions,
  'นครพนม': nakhonPhanom.nakhonPhanomAttractions,
  'nakhon-phanom': nakhonPhanom.nakhonPhanomAttractions,
  'nakhonphanom': nakhonPhanom.nakhonPhanomAttractions,
  'บึงกาฬ': buengKan.buengKanAttractions,
  'bueng-kan': buengKan.buengKanAttractions,
  'buengkan': buengKan.buengKanAttractions,
  // Southern provinces
  'ภูเก็ต': phuket.phuketAttractions,
  'phuket': phuket.phuketAttractions,
  'กระบี่': krabi.krabiAttractions,
  'krabi': krabi.krabiAttractions,
  'พังงา': phangNga.phangNgaAttractions,
  'phang-nga': phangNga.phangNgaAttractions,
  'phangnga': phangNga.phangNgaAttractions,
  'ตรัง': trang.trangAttractions,
  'trang': trang.trangAttractions,
  'สงขลา': songkhla.songkhlaAttractions,
  'songkhla': songkhla.songkhlaAttractions,
  'นครศรีธรรมราช': nakhonSiThammarat.nakhonSiThammaratAttractions,
  'nakhon-si-thammarat': nakhonSiThammarat.nakhonSiThammaratAttractions,
  'nakhonsithammarat': nakhonSiThammarat.nakhonSiThammaratAttractions,
  'สุราษฎร์ธานี': suratThani.suratThaniAttractions,
  'surat-thani': suratThani.suratThaniAttractions,
  'suratthani': suratThani.suratThaniAttractions,
  'พัทลุง': phatthalung.phatthalungAttractions,
  'phatthalung': phatthalung.phatthalungAttractions,
  'ชุมพร': chumphon.chumphonAttractions,
  'chumphon': chumphon.chumphonAttractions,
  'ระนอง': ranong.ranongAttractions,
  'ranong': ranong.ranongAttractions,
  'สตูล': satun.satunAttractions,
  'satun': satun.satunAttractions,
  'ปัตตานี': pattani.pattaniAttractions,
  'pattani': pattani.pattaniAttractions,
  'ยะลา': yala.yalaAttractions,
  'yala': yala.yalaAttractions,
  'นราธิวาส': narathiwat.narathiwatAttractions,
  'narathiwat': narathiwat.narathiwatAttractions
};

// Get all attractions for a province
const getAttractionsByProvince = (provinceName) => {
  // Try different formats
  const key = provinceName.toLowerCase().replace(/\s+/g, '-');
  const directKey = provinceName;
  
  return attractionsByProvince[key] || 
         attractionsByProvince[directKey] || 
         attractionsByProvince[provinceName] || 
         [];
};

// Get attraction by ID across all provinces
const getAttractionById = (id) => {
  // Check each province
  const allProvinces = [
    samutPrakan,
    { getAttractionById: (id) => bangkokAttractions.find(a => a.id === id) },
    pathumThani,
    nonthaburi,
    ayutthaya,
    lopburi,
    saraburi,
    angThong,
    singburi,
    chainat,
    chiangMai,
    chiangRai,
    lampang,
    lamphun,
    nan,
    phayao,
    phrae,
    maeHongSon,
    uttaradit,
    tak, sukhothai, phitsanulok, pichit, kamphaengPhet, nakhonSawan, uthaiThani,
    nakhonNayok, prachinBuri, saKaeo, chachoengsao, samutSakhon, samutSongkhram, nakhonPathom, suphanBuri,
    chonburi, rayong, chanthaburi, trat,
    kanchanaburi, ratchaburi, phetchaburi, prachuapKhiriKhan,
    khonKaen, udonThani, nakhonRatchasima, ubonRatchathani, mahasarakham, roiet, kalasin, sakonNakhon,
    buriram, surin, siSaKet, yasothon, chaiyaphum, amnatCharoen, nongBuaLamphu, loei, nongKhai, mukdahan, nakhonPhanom, buengKan,
    phuket, krabi, phangNga, trang, songkhla, nakhonSiThammarat, suratThani, phatthalung, chumphon, ranong, satun, pattani, yala, narathiwat
  ];
  
  for (const province of allProvinces) {
    if (province.getAttractionById) {
      const attraction = province.getAttractionById(id);
      if (attraction) return attraction;
    }
  }
  
  return null;
};

// Get all active attractions across all provinces
const getAllAttractions = () => {
  const allAttractions = [];
  
  // Add Samut Prakan
  if (samutPrakan.getAllActiveAttractions) {
    allAttractions.push(...samutPrakan.getAllActiveAttractions());
  }
  
  // Add Bangkok
  allAttractions.push(...bangkokAttractions.filter(a => a.isActive));
  
  // Add Pathum Thani
  if (pathumThani.getAllActiveAttractions) {
    allAttractions.push(...pathumThani.getAllActiveAttractions());
  }
  
  // Add Nonthaburi
  if (nonthaburi.getAllActiveAttractions) {
    allAttractions.push(...nonthaburi.getAllActiveAttractions());
  }
  
  // Add Ayutthaya
  if (ayutthaya.getAllActiveAttractions) {
    allAttractions.push(...ayutthaya.getAllActiveAttractions());
  }
  
  // Add Lopburi
  if (lopburi.getAllActiveAttractions) {
    allAttractions.push(...lopburi.getAllActiveAttractions());
  }
  
  // Add Saraburi
  if (saraburi.getAllActiveAttractions) {
    allAttractions.push(...saraburi.getAllActiveAttractions());
  }
  
  // Add Ang Thong
  if (angThong.getAllActiveAttractions) {
    allAttractions.push(...angThong.getAllActiveAttractions());
  }
  
  // Add Singburi
  if (singburi.getAllActiveAttractions) {
    allAttractions.push(...singburi.getAllActiveAttractions());
  }
  
  // Add Chainat
  if (chainat.getAllActiveAttractions) {
    allAttractions.push(...chainat.getAllActiveAttractions());
  }
  
  // Add Northern provinces
  // Add Chiang Mai
  if (chiangMai.getAllActiveAttractions) {
    allAttractions.push(...chiangMai.getAllActiveAttractions());
  }
  
  // Add Chiang Rai
  if (chiangRai.getAllActiveAttractions) {
    allAttractions.push(...chiangRai.getAllActiveAttractions());
  }
  
  // Add Lampang
  if (lampang.getAllActiveAttractions) {
    allAttractions.push(...lampang.getAllActiveAttractions());
  }
  
  // Add Lamphun
  if (lamphun.getAllActiveAttractions) {
    allAttractions.push(...lamphun.getAllActiveAttractions());
  }
  
  // Add Nan
  if (nan.getAllActiveAttractions) {
    allAttractions.push(...nan.getAllActiveAttractions());
  }
  
  // Add Phayao
  if (phayao.getAllActiveAttractions) {
    allAttractions.push(...phayao.getAllActiveAttractions());
  }
  
  // Add Phrae
  if (phrae.getAllActiveAttractions) {
    allAttractions.push(...phrae.getAllActiveAttractions());
  }
  
  // Add Mae Hong Son
  if (maeHongSon.getAllActiveAttractions) {
    allAttractions.push(...maeHongSon.getAllActiveAttractions());
  }
  
  // Add Uttaradit
  if (uttaradit.getAllActiveAttractions) {
    allAttractions.push(...uttaradit.getAllActiveAttractions());
  }
  
  // Add additional Northern provinces
  if (tak && tak.getAllActiveAttractions) allAttractions.push(...tak.getAllActiveAttractions());
  if (sukhothai && sukhothai.getAllActiveAttractions) allAttractions.push(...sukhothai.getAllActiveAttractions());
  if (phitsanulok && phitsanulok.getAllActiveAttractions) allAttractions.push(...phitsanulok.getAllActiveAttractions());
  if (pichit && pichit.getAllActiveAttractions) allAttractions.push(...pichit.getAllActiveAttractions());
  if (kamphaengPhet && kamphaengPhet.getAllActiveAttractions) allAttractions.push(...kamphaengPhet.getAllActiveAttractions());
  if (nakhonSawan && nakhonSawan.getAllActiveAttractions) allAttractions.push(...nakhonSawan.getAllActiveAttractions());
  if (uthaiThani && uthaiThani.getAllActiveAttractions) allAttractions.push(...uthaiThani.getAllActiveAttractions());
  
  // Add additional Central provinces
  if (nakhonNayok && nakhonNayok.getAllActiveAttractions) allAttractions.push(...nakhonNayok.getAllActiveAttractions());
  if (prachinBuri && prachinBuri.getAllActiveAttractions) allAttractions.push(...prachinBuri.getAllActiveAttractions());
  if (saKaeo && saKaeo.getAllActiveAttractions) allAttractions.push(...saKaeo.getAllActiveAttractions());
  if (chachoengsao && chachoengsao.getAllActiveAttractions) allAttractions.push(...chachoengsao.getAllActiveAttractions());
  if (samutSakhon && samutSakhon.getAllActiveAttractions) allAttractions.push(...samutSakhon.getAllActiveAttractions());
  if (samutSongkhram && samutSongkhram.getAllActiveAttractions) allAttractions.push(...samutSongkhram.getAllActiveAttractions());
  if (nakhonPathom && nakhonPathom.getAllActiveAttractions) allAttractions.push(...nakhonPathom.getAllActiveAttractions());
  if (suphanBuri && suphanBuri.getAllActiveAttractions) allAttractions.push(...suphanBuri.getAllActiveAttractions());
  
  // Add Eastern provinces
  if (chonburi && chonburi.getAllActiveAttractions) allAttractions.push(...chonburi.getAllActiveAttractions());
  if (rayong && rayong.getAllActiveAttractions) allAttractions.push(...rayong.getAllActiveAttractions());
  if (chanthaburi && chanthaburi.getAllActiveAttractions) allAttractions.push(...chanthaburi.getAllActiveAttractions());
  if (trat && trat.getAllActiveAttractions) allAttractions.push(...trat.getAllActiveAttractions());
  
  // Add Western provinces
  if (kanchanaburi && kanchanaburi.getAllActiveAttractions) allAttractions.push(...kanchanaburi.getAllActiveAttractions());
  if (ratchaburi && ratchaburi.getAllActiveAttractions) allAttractions.push(...ratchaburi.getAllActiveAttractions());
  if (phetchaburi && phetchaburi.getAllActiveAttractions) allAttractions.push(...phetchaburi.getAllActiveAttractions());
  if (prachuapKhiriKhan && prachuapKhiriKhan.getAllActiveAttractions) allAttractions.push(...prachuapKhiriKhan.getAllActiveAttractions());
  
  // Add Northeastern provinces
  if (khonKaen && khonKaen.getAllActiveAttractions) allAttractions.push(...khonKaen.getAllActiveAttractions());
  if (udonThani && udonThani.getAllActiveAttractions) allAttractions.push(...udonThani.getAllActiveAttractions());
  if (nakhonRatchasima && nakhonRatchasima.getAllActiveAttractions) allAttractions.push(...nakhonRatchasima.getAllActiveAttractions());
  if (ubonRatchathani && ubonRatchathani.getAllActiveAttractions) allAttractions.push(...ubonRatchathani.getAllActiveAttractions());
  if (mahasarakham && mahasarakham.getAllActiveAttractions) allAttractions.push(...mahasarakham.getAllActiveAttractions());
  if (roiet && roiet.getAllActiveAttractions) allAttractions.push(...roiet.getAllActiveAttractions());
  if (kalasin && kalasin.getAllActiveAttractions) allAttractions.push(...kalasin.getAllActiveAttractions());
  if (sakonNakhon && sakonNakhon.getAllActiveAttractions) allAttractions.push(...sakonNakhon.getAllActiveAttractions());
  if (buriram && buriram.getAllActiveAttractions) allAttractions.push(...buriram.getAllActiveAttractions());
  if (surin && surin.getAllActiveAttractions) allAttractions.push(...surin.getAllActiveAttractions());
  if (siSaKet && siSaKet.getAllActiveAttractions) allAttractions.push(...siSaKet.getAllActiveAttractions());
  if (yasothon && yasothon.getAllActiveAttractions) allAttractions.push(...yasothon.getAllActiveAttractions());
  if (chaiyaphum && chaiyaphum.getAllActiveAttractions) allAttractions.push(...chaiyaphum.getAllActiveAttractions());
  if (amnatCharoen && amnatCharoen.getAllActiveAttractions) allAttractions.push(...amnatCharoen.getAllActiveAttractions());
  if (nongBuaLamphu && nongBuaLamphu.getAllActiveAttractions) allAttractions.push(...nongBuaLamphu.getAllActiveAttractions());
  if (loei && loei.getAllActiveAttractions) allAttractions.push(...loei.getAllActiveAttractions());
  if (nongKhai && nongKhai.getAllActiveAttractions) allAttractions.push(...nongKhai.getAllActiveAttractions());
  if (mukdahan && mukdahan.getAllActiveAttractions) allAttractions.push(...mukdahan.getAllActiveAttractions());
  if (nakhonPhanom && nakhonPhanom.getAllActiveAttractions) allAttractions.push(...nakhonPhanom.getAllActiveAttractions());
  if (buengKan && buengKan.getAllActiveAttractions) allAttractions.push(...buengKan.getAllActiveAttractions());
  
  // Add Southern provinces
  if (phuket && phuket.getAllActiveAttractions) allAttractions.push(...phuket.getAllActiveAttractions());
  if (krabi && krabi.getAllActiveAttractions) allAttractions.push(...krabi.getAllActiveAttractions());
  if (phangNga && phangNga.getAllActiveAttractions) allAttractions.push(...phangNga.getAllActiveAttractions());
  if (trang && trang.getAllActiveAttractions) allAttractions.push(...trang.getAllActiveAttractions());
  if (songkhla && songkhla.getAllActiveAttractions) allAttractions.push(...songkhla.getAllActiveAttractions());
  if (nakhonSiThammarat && nakhonSiThammarat.getAllActiveAttractions) allAttractions.push(...nakhonSiThammarat.getAllActiveAttractions());
  if (suratThani && suratThani.getAllActiveAttractions) allAttractions.push(...suratThani.getAllActiveAttractions());
  if (phatthalung && phatthalung.getAllActiveAttractions) allAttractions.push(...phatthalung.getAllActiveAttractions());
  if (chumphon && chumphon.getAllActiveAttractions) allAttractions.push(...chumphon.getAllActiveAttractions());
  if (ranong && ranong.getAllActiveAttractions) allAttractions.push(...ranong.getAllActiveAttractions());
  if (satun && satun.getAllActiveAttractions) allAttractions.push(...satun.getAllActiveAttractions());
  if (pattani && pattani.getAllActiveAttractions) allAttractions.push(...pattani.getAllActiveAttractions());
  if (yala && yala.getAllActiveAttractions) allAttractions.push(...yala.getAllActiveAttractions());
  if (narathiwat && narathiwat.getAllActiveAttractions) allAttractions.push(...narathiwat.getAllActiveAttractions());
  
  return allAttractions;
};

// Search attractions by name across all provinces
const searchAttractions = (searchTerm) => {
  const results = [];
  
  // Search in Samut Prakan
  if (samutPrakan.searchAttractionsByName) {
    results.push(...samutPrakan.searchAttractionsByName(searchTerm));
  }
  
  // Search in Bangkok
  const searchLower = searchTerm.toLowerCase();
  results.push(...bangkokAttractions.filter(a => 
    a.isActive && (
      a.name.toLowerCase().includes(searchLower) ||
      a.nameEn.toLowerCase().includes(searchLower) ||
      a.description.toLowerCase().includes(searchLower)
    )
  ));
  
  // Search in Pathum Thani
  if (pathumThani.searchAttractionsByName) {
    results.push(...pathumThani.searchAttractionsByName(searchTerm));
  }
  
  // Search in Nonthaburi
  if (nonthaburi.searchAttractionsByName) {
    results.push(...nonthaburi.searchAttractionsByName(searchTerm));
  }
  
  // Search in Ayutthaya
  if (ayutthaya.searchAttractionsByName) {
    results.push(...ayutthaya.searchAttractionsByName(searchTerm));
  }
  
  // Search in Lopburi
  if (lopburi.searchAttractionsByName) {
    results.push(...lopburi.searchAttractionsByName(searchTerm));
  }
  
  // Search in Saraburi
  if (saraburi.searchAttractionsByName) {
    results.push(...saraburi.searchAttractionsByName(searchTerm));
  }
  
  // Search in Ang Thong
  if (angThong.searchAttractionsByName) {
    results.push(...angThong.searchAttractionsByName(searchTerm));
  }
  
  // Search in Singburi
  if (singburi.searchAttractionsByName) {
    results.push(...singburi.searchAttractionsByName(searchTerm));
  }
  
  // Search in Chainat
  if (chainat.searchAttractionsByName) {
    results.push(...chainat.searchAttractionsByName(searchTerm));
  }
  
  // Search in Northern provinces
  // Search in Chiang Mai
  if (chiangMai.getAllActiveAttractions) {
    const searchLower = searchTerm.toLowerCase();
    results.push(...chiangMai.getAllActiveAttractions().filter(a => 
      a.name.toLowerCase().includes(searchLower) ||
      a.nameEn.toLowerCase().includes(searchLower) ||
      a.description.toLowerCase().includes(searchLower)
    ));
  }
  
  // Search in Chiang Rai
  if (chiangRai.getAllActiveAttractions) {
    const searchLower = searchTerm.toLowerCase();
    results.push(...chiangRai.getAllActiveAttractions().filter(a => 
      a.name.toLowerCase().includes(searchLower) ||
      a.nameEn.toLowerCase().includes(searchLower) ||
      a.description.toLowerCase().includes(searchLower)
    ));
  }
  
  // Search in Lampang
  if (lampang.getAllActiveAttractions) {
    const searchLower = searchTerm.toLowerCase();
    results.push(...lampang.getAllActiveAttractions().filter(a => 
      a.name.toLowerCase().includes(searchLower) ||
      a.nameEn.toLowerCase().includes(searchLower) ||
      a.description.toLowerCase().includes(searchLower)
    ));
  }
  
  // Search in Lamphun
  if (lamphun.getAllActiveAttractions) {
    const searchLower = searchTerm.toLowerCase();
    results.push(...lamphun.getAllActiveAttractions().filter(a => 
      a.name.toLowerCase().includes(searchLower) ||
      a.nameEn.toLowerCase().includes(searchLower) ||
      a.description.toLowerCase().includes(searchLower)
    ));
  }
  
  // Search in Nan
  if (nan.getAllActiveAttractions) {
    const searchLower = searchTerm.toLowerCase();
    results.push(...nan.getAllActiveAttractions().filter(a => 
      a.name.toLowerCase().includes(searchLower) ||
      a.nameEn.toLowerCase().includes(searchLower) ||
      a.description.toLowerCase().includes(searchLower)
    ));
  }
  
  // Search in Phayao
  if (phayao.getAllActiveAttractions) {
    const searchLower = searchTerm.toLowerCase();
    results.push(...phayao.getAllActiveAttractions().filter(a => 
      a.name.toLowerCase().includes(searchLower) ||
      a.nameEn.toLowerCase().includes(searchLower) ||
      a.description.toLowerCase().includes(searchLower)
    ));
  }
  
  // Search in Phrae
  if (phrae.getAllActiveAttractions) {
    const searchLower = searchTerm.toLowerCase();
    results.push(...phrae.getAllActiveAttractions().filter(a => 
      a.name.toLowerCase().includes(searchLower) ||
      a.nameEn.toLowerCase().includes(searchLower) ||
      a.description.toLowerCase().includes(searchLower)
    ));
  }
  
  // Search in Mae Hong Son
  if (maeHongSon.getAllActiveAttractions) {
    const searchLower = searchTerm.toLowerCase();
    results.push(...maeHongSon.getAllActiveAttractions().filter(a => 
      a.name.toLowerCase().includes(searchLower) ||
      a.nameEn.toLowerCase().includes(searchLower) ||
      a.description.toLowerCase().includes(searchLower)
    ));
  }
  
  // Search in Uttaradit
  if (uttaradit.getAllActiveAttractions) {
    const searchLower = searchTerm.toLowerCase();
    results.push(...uttaradit.getAllActiveAttractions().filter(a => 
      a.name.toLowerCase().includes(searchLower) ||
      a.nameEn.toLowerCase().includes(searchLower) ||
      a.description.toLowerCase().includes(searchLower)
    ));
  }
  
  return results;
};

// Get attractions by category across all provinces
const getAttractionsByCategory = (category) => {
  const results = [];
  
  // Get from Samut Prakan
  if (samutPrakan.getAttractionsByCategory) {
    results.push(...samutPrakan.getAttractionsByCategory(category));
  }
  
  // Get from Bangkok
  results.push(...bangkokAttractions.filter(a => a.isActive && a.category === category));
  
  // Get from Pathum Thani
  if (pathumThani.getAttractionsByCategory) {
    results.push(...pathumThani.getAttractionsByCategory(category));
  }
  
  // Get from Northern provinces
  if (chiangMai.getAttractionsByCategory) {
    results.push(...chiangMai.getAttractionsByCategory(category));
  }
  if (chiangRai.getAttractionsByCategory) {
    results.push(...chiangRai.getAttractionsByCategory(category));
  }
  if (lampang.getAttractionsByCategory) {
    results.push(...lampang.getAttractionsByCategory(category));
  }
  if (lamphun.getAttractionsByCategory) {
    results.push(...lamphun.getAttractionsByCategory(category));
  }
  if (nan.getAttractionsByCategory) {
    results.push(...nan.getAttractionsByCategory(category));
  }
  if (phayao.getAttractionsByCategory) {
    results.push(...phayao.getAttractionsByCategory(category));
  }
  if (phrae.getAttractionsByCategory) {
    results.push(...phrae.getAttractionsByCategory(category));
  }
  if (maeHongSon.getAttractionsByCategory) {
    results.push(...maeHongSon.getAttractionsByCategory(category));
  }
  if (uttaradit.getAttractionsByCategory) {
    results.push(...uttaradit.getAttractionsByCategory(category));
  }
  
  // Get from all remaining provinces
  const allRemainingProvinces = [
    tak, sukhothai, phitsanulok, pichit, kamphaengPhet, nakhonSawan, uthaiThani,
    nakhonNayok, prachinBuri, saKaeo, chachoengsao, samutSakhon, samutSongkhram, nakhonPathom, suphanBuri,
    chonburi, rayong, chanthaburi, trat,
    kanchanaburi, ratchaburi, phetchaburi, prachuapKhiriKhan,
    khonKaen, udonThani, nakhonRatchasima, ubonRatchathani, mahasarakham, roiet, kalasin, sakonNakhon,
    buriram, surin, siSaKet, yasothon, chaiyaphum, amnatCharoen, nongBuaLamphu, loei, nongKhai, mukdahan, nakhonPhanom, buengKan,
    phuket, krabi, phangNga, trang, songkhla, nakhonSiThammarat, suratThani, phatthalung, chumphon, ranong, satun, pattani, yala, narathiwat
  ];
  
  for (const province of allRemainingProvinces) {
    if (province && province.getAttractionsByCategory) {
      results.push(...province.getAttractionsByCategory(category));
    }
  }
  
  return results;
};

module.exports = {
  // Province-specific exports
  samutPrakan,
  bangkok: bangkokAttractions,
  pathumThani,
  nonthaburi,
  ayutthaya,
  lopburi,
  saraburi,
  angThong,
  singburi,
  chainat,
  // Northern provinces
  chiangMai,
  chiangRai,
  lampang,
  lamphun,
  nan,
  phayao,
  phrae,
  maeHongSon,
  uttaradit,
  
  // Cross-province functions
  getAttractionsByProvince,
  getAttractionById,
  getAllAttractions,
  searchAttractions,
  getAttractionsByCategory,
  
  // Direct access to province data
  attractionsByProvince
};
