// scripts/add-all-remaining-provinces-attractions.js
// Migration script to add all remaining tourist attractions to MongoDB

const mongoose = require('mongoose');
const TouristAttraction = require('../models/TouristAttraction');

// Import all province data
const tak = require('../data/tourist-attractions/tak');
const sukhothai = require('../data/tourist-attractions/sukhothai');
const phitsanulok = require('../data/tourist-attractions/phitsanulok');
const pichit = require('../data/tourist-attractions/pichit');
const kamphaengPhet = require('../data/tourist-attractions/kamphaeng-phet');
const nakhonSawan = require('../data/tourist-attractions/nakhon-sawan');
const uthaiThani = require('../data/tourist-attractions/uthai-thani');
const nakhonNayok = require('../data/tourist-attractions/nakhon-nayok');
const prachinBuri = require('../data/tourist-attractions/prachin-buri');
const saKaeo = require('../data/tourist-attractions/sa-kaeo');
const chachoengsao = require('../data/tourist-attractions/chachoengsao');
const samutSakhon = require('../data/tourist-attractions/samut-sakhon');
const samutSongkhram = require('../data/tourist-attractions/samut-songkhram');
const nakhonPathom = require('../data/tourist-attractions/nakhon-pathom');
const suphanBuri = require('../data/tourist-attractions/suphan-buri');
const chonburi = require('../data/tourist-attractions/chonburi');
const rayong = require('../data/tourist-attractions/rayong');
const chanthaburi = require('../data/tourist-attractions/chanthaburi');
const trat = require('../data/tourist-attractions/trat');
const kanchanaburi = require('../data/tourist-attractions/kanchanaburi');
const ratchaburi = require('../data/tourist-attractions/ratchaburi');
const phetchaburi = require('../data/tourist-attractions/phetchaburi');
const prachuapKhiriKhan = require('../data/tourist-attractions/prachuap-khiri-khan');
const khonKaen = require('../data/tourist-attractions/khon-kaen');
const udonThani = require('../data/tourist-attractions/udon-thani');
const nakhonRatchasima = require('../data/tourist-attractions/nakhon-ratchasima');
const ubonRatchathani = require('../data/tourist-attractions/ubon-ratchathani');
const mahasarakham = require('../data/tourist-attractions/mahasarakham');
const roiet = require('../data/tourist-attractions/roiet');
const kalasin = require('../data/tourist-attractions/kalasin');
const sakonNakhon = require('../data/tourist-attractions/sakon-nakhon');
const buriram = require('../data/tourist-attractions/buriram');
const surin = require('../data/tourist-attractions/surin');
const siSaKet = require('../data/tourist-attractions/si-sa-ket');
const yasothon = require('../data/tourist-attractions/yasothon');
const chaiyaphum = require('../data/tourist-attractions/chaiyaphum');
const amnatCharoen = require('../data/tourist-attractions/amnat-charoen');
const nongBuaLamphu = require('../data/tourist-attractions/nong-bua-lamphu');
const loei = require('../data/tourist-attractions/loei');
const nongKhai = require('../data/tourist-attractions/nong-khai');
const mukdahan = require('../data/tourist-attractions/mukdahan');
const nakhonPhanom = require('../data/tourist-attractions/nakhon-phanom');
const buengKan = require('../data/tourist-attractions/bueng-kan');
const phuket = require('../data/tourist-attractions/phuket');
const krabi = require('../data/tourist-attractions/krabi');
const phangNga = require('../data/tourist-attractions/phang-nga');
const trang = require('../data/tourist-attractions/trang');
const songkhla = require('../data/tourist-attractions/songkhla');
const nakhonSiThammarat = require('../data/tourist-attractions/nakhon-si-thammarat');
const suratThani = require('../data/tourist-attractions/surat-thani');
const phatthalung = require('../data/tourist-attractions/phatthalung');
const chumphon = require('../data/tourist-attractions/chumphon');
const ranong = require('../data/tourist-attractions/ranong');
const satun = require('../data/tourist-attractions/satun');
const pattani = require('../data/tourist-attractions/pattani');
const yala = require('../data/tourist-attractions/yala');
const narathiwat = require('../data/tourist-attractions/narathiwat');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaiquestify';

// Province data mapping
const provinces = [
  { name: 'Tak', data: tak.takAttractions, provinceName: 'ตาก' },
  { name: 'Sukhothai', data: sukhothai.sukhothaiAttractions, provinceName: 'สุโขทัย' },
  { name: 'Phitsanulok', data: phitsanulok.phitsanulokAttractions, provinceName: 'พิษณุโลก' },
  { name: 'Pichit', data: pichit.pichitAttractions, provinceName: 'พิจิตร' },
  { name: 'Kamphaeng Phet', data: kamphaengPhet.kamphaengPhetAttractions, provinceName: 'กำแพงเพชร' },
  { name: 'Nakhon Sawan', data: nakhonSawan.nakhonSawanAttractions, provinceName: 'นครสวรรค์' },
  { name: 'Uthai Thani', data: uthaiThani.uthaiThaniAttractions, provinceName: 'อุทัยธานี' },
  { name: 'Nakhon Nayok', data: nakhonNayok.nakhonNayokAttractions, provinceName: 'นครนายก' },
  { name: 'Prachin Buri', data: prachinBuri.prachinBuriAttractions, provinceName: 'ปราจีนบุรี' },
  { name: 'Sa Kaeo', data: saKaeo.saKaeoAttractions, provinceName: 'สระแก้ว' },
  { name: 'Chachoengsao', data: chachoengsao.chachoengsaoAttractions, provinceName: 'ฉะเชิงเทรา' },
  { name: 'Samut Sakhon', data: samutSakhon.samutSakhonAttractions, provinceName: 'สมุทรสาคร' },
  { name: 'Samut Songkhram', data: samutSongkhram.samutSongkhramAttractions, provinceName: 'สมุทรสงคราม' },
  { name: 'Nakhon Pathom', data: nakhonPathom.nakhonPathomAttractions, provinceName: 'นครปฐม' },
  { name: 'Suphan Buri', data: suphanBuri.suphanBuriAttractions, provinceName: 'สุพรรณบุรี' },
  { name: 'Chonburi', data: chonburi.chonburiAttractions, provinceName: 'ชลบุรี' },
  { name: 'Rayong', data: rayong.rayongAttractions, provinceName: 'ระยอง' },
  { name: 'Chanthaburi', data: chanthaburi.chanthaburiAttractions, provinceName: 'จันทบุรี' },
  { name: 'Trat', data: trat.tratAttractions, provinceName: 'ตราด' },
  { name: 'Kanchanaburi', data: kanchanaburi.kanchanaburiAttractions, provinceName: 'กาญจนบุรี' },
  { name: 'Ratchaburi', data: ratchaburi.ratchaburiAttractions, provinceName: 'ราชบุรี' },
  { name: 'Phetchaburi', data: phetchaburi.phetchaburiAttractions, provinceName: 'เพชรบุรี' },
  { name: 'Prachuap Khiri Khan', data: prachuapKhiriKhan.prachuapKhiriKhanAttractions, provinceName: 'ประจวบคีรีขันธ์' },
  { name: 'Khon Kaen', data: khonKaen.khonKaenAttractions, provinceName: 'ขอนแก่น' },
  { name: 'Udon Thani', data: udonThani.udonThaniAttractions, provinceName: 'อุดรธานี' },
  { name: 'Nakhon Ratchasima', data: nakhonRatchasima.nakhonRatchasimaAttractions, provinceName: 'นครราชสีมา' },
  { name: 'Ubon Ratchathani', data: ubonRatchathani.ubonRatchathaniAttractions, provinceName: 'อุบลราชธานี' },
  { name: 'Maha Sarakham', data: mahasarakham.mahasarakhamAttractions, provinceName: 'มหาสารคาม' },
  { name: 'Roi Et', data: roiet.roietAttractions, provinceName: 'ร้อยเอ็ด' },
  { name: 'Kalasin', data: kalasin.kalasinAttractions, provinceName: 'กาฬสินธุ์' },
  { name: 'Sakon Nakhon', data: sakonNakhon.sakonNakhonAttractions, provinceName: 'สกลนคร' },
  { name: 'Buriram', data: buriram.buriramAttractions, provinceName: 'บุรีรัมย์' },
  { name: 'Surin', data: surin.surinAttractions, provinceName: 'สุรินทร์' },
  { name: 'Si Sa Ket', data: siSaKet.siSaKetAttractions, provinceName: 'ศรีสะเกษ' },
  { name: 'Yasothon', data: yasothon.yasothonAttractions, provinceName: 'ยโสธร' },
  { name: 'Chaiyaphum', data: chaiyaphum.chaiyaphumAttractions, provinceName: 'ชัยภูมิ' },
  { name: 'Amnat Charoen', data: amnatCharoen.amnatCharoenAttractions, provinceName: 'อำนาจเจริญ' },
  { name: 'Nong Bua Lamphu', data: nongBuaLamphu.nongBuaLamphuAttractions, provinceName: 'หนองบัวลำภู' },
  { name: 'Loei', data: loei.loeiAttractions, provinceName: 'เลย' },
  { name: 'Nong Khai', data: nongKhai.nongKhaiAttractions, provinceName: 'หนองคาย' },
  { name: 'Mukdahan', data: mukdahan.mukdahanAttractions, provinceName: 'มุกดาหาร' },
  { name: 'Nakhon Phanom', data: nakhonPhanom.nakhonPhanomAttractions, provinceName: 'นครพนม' },
  { name: 'Bueng Kan', data: buengKan.buengKanAttractions, provinceName: 'บึงกาฬ' },
  { name: 'Phuket', data: phuket.phuketAttractions, provinceName: 'ภูเก็ต' },
  { name: 'Krabi', data: krabi.krabiAttractions, provinceName: 'กระบี่' },
  { name: 'Phang Nga', data: phangNga.phangNgaAttractions, provinceName: 'พังงา' },
  { name: 'Trang', data: trang.trangAttractions, provinceName: 'ตรัง' },
  { name: 'Songkhla', data: songkhla.songkhlaAttractions, provinceName: 'สงขลา' },
  { name: 'Nakhon Si Thammarat', data: nakhonSiThammarat.nakhonSiThammaratAttractions, provinceName: 'นครศรีธรรมราช' },
  { name: 'Surat Thani', data: suratThani.suratThaniAttractions, provinceName: 'สุราษฎร์ธานี' },
  { name: 'Phatthalung', data: phatthalung.phatthalungAttractions, provinceName: 'พัทลุง' },
  { name: 'Chumphon', data: chumphon.chumphonAttractions, provinceName: 'ชุมพร' },
  { name: 'Ranong', data: ranong.ranongAttractions, provinceName: 'ระนอง' },
  { name: 'Satun', data: satun.satunAttractions, provinceName: 'สตูล' },
  { name: 'Pattani', data: pattani.pattaniAttractions, provinceName: 'ปัตตานี' },
  { name: 'Yala', data: yala.yalaAttractions, provinceName: 'ยะลา' },
  { name: 'Narathiwat', data: narathiwat.narathiwatAttractions, provinceName: 'นราธิวาส' }
];

async function migrateAllRemainingProvincesAttractions() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    let totalAdded = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const province of provinces) {
      console.log(`📦 Processing ${province.provinceName} (${province.data.length} attractions)...\n`);
      
      let added = 0;
      let updated = 0;
      let skipped = 0;

      for (const attraction of province.data) {
        try {
          // Check if attraction already exists
          const existing = await TouristAttraction.findOne({ id: attraction.id });
          
          if (existing) {
            // Update existing attraction
            await TouristAttraction.findOneAndUpdate(
              { id: attraction.id },
              {
                $set: {
                  name: attraction.name,
                  nameEn: attraction.nameEn,
                  description: attraction.description,
                  coordinates: attraction.coordinates,
                  category: attraction.category,
                  categories: attraction.categories,
                  province: attraction.province,
                  district: attraction.district,
                  address: attraction.address,
                  checkInRadius: attraction.checkInRadius,
                  thumbnail: attraction.thumbnail,
                  isActive: attraction.isActive,
                  updatedAt: new Date()
                }
              }
            );
            updated++;
            totalUpdated++;
          } else {
            // Create new attraction
            await TouristAttraction.create(attraction);
            added++;
            totalAdded++;
          }
        } catch (error) {
          console.error(`❌ Error processing ${attraction.id}:`, error.message);
          skipped++;
          totalSkipped++;
        }
      }
      
      console.log(`✅ ${province.provinceName}: ${added} added, ${updated} updated, ${skipped} skipped\n`);
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Total added: ${totalAdded}`);
    console.log(`   🔄 Total updated: ${totalUpdated}`);
    console.log(`   ⚠️  Total skipped: ${totalSkipped}`);
    console.log(`   📈 Total processed: ${totalAdded + totalUpdated + totalSkipped}\n`);

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run migration
migrateAllRemainingProvincesAttractions();
