// data/tourist-attractions/bangkok.js
// สถานที่ท่องเที่ยวกรุงเทพมหานคร สำหรับเควส Check-in

const bangkokAttractions = [
  {
    id: 'bangkok-001',
    name: 'ไอคอนสยาม',
    nameEn: 'ICONSIAM',
    description: 'ศูนย์การค้าลักซ์ชูรี่ริมแม่น้ำเจ้าพระยา มีโซนจำลองตลาดน้ำ, ร้านอาหาร, คาเฟ่, มุมมองแม่น้ำสวยงามโดยเฉพาะช่วงเย็น, โชว์แสงสีเสียง, โซน "สุกสยาม" ตลาดและอาหารท้องถิ่น, นิทรรศการศิลปะ, และกิจกรรมพิเศษ',
    coordinates: {
      latitude: 13.7267,
      longitude: 100.5109
    },
    category: 'shopping', // Keep for backward compatibility
    categories: ['shopping', 'recommended'], // Multiple categories: shopping mall and recommended for tourists
    province: 'กรุงเทพมหานคร',
    district: 'เขตคลองสาน',
    address: '299 ถนนเจริญนคร แขวงคลองต้นไทร เขตคลองสาน กรุงเทพมหานคร',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-002',
    name: 'เยาวราช (ไชนาทาวน์)',
    nameEn: 'Yaowarat (Chinatown Bangkok)',
    description: 'ย่านเก่าอายุนับร้อยปี อุดมไปด้วยวัฒนธรรมจีน มีอาหารริมทางชื่อดัง, ร้านทอง, ยาจีนแผนโบราณ, จุดถ่ายรูปสวยงามช่วงตรุษจีนพร้อมไฟประดับ, วัดไตรมิตร (พระพุทธรูปทองคำ), ประตูทางเข้าถนนเยาวราช',
    coordinates: {
      latitude: 13.7411,
      longitude: 100.5099
    },
    category: 'historical', // culture -> historical
    province: 'กรุงเทพมหานคร',
    district: 'เขตสัมพันธวงศ์',
    address: 'ถนนเยาวราช เขตสัมพันธวงศ์ กรุงเทพมหานคร',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-003',
    name: 'ประตูไชนาทาวน์',
    nameEn: 'The Chinatown Gate',
    description: 'ประตูสัญลักษณ์สำคัญของถนนเยาวราช สถาปัตยกรรมจีนโดดเด่น เหมาะสำหรับถ่ายรูปและเป็นจุดเริ่มต้นสำรวจเยาวราช',
    coordinates: {
      latitude: 13.7402,
      longitude: 100.5134
    },
    category: 'historical',
    province: 'กรุงเทพมหานคร',
    district: 'เขตสัมพันธวงศ์',
    address: 'ถนนเยาวราช เขตสัมพันธวงศ์ กรุงเทพมหานคร',
    checkInRadius: 50,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-004',
    name: 'มหานคร สกายวอล์ก',
    nameEn: 'MAHANAKHON CENTER',
    description: 'อาคารระฟ้าสูงที่สุดในประเทศไทย ดีไซน์พิกเซลสุดโดดเด่น มี Mahanakhon SkyWalk ชั้น 78 มุมมอง 360 องศาเมืองกรุงเทพ ร้านอาหาร, คาเฟ่, ร้านแบรนด์เนม',
    coordinates: {
      latitude: 13.7236,
      longitude: 100.5350
    },
    category: 'other', // observation -> other
    province: 'กรุงเทพมหานคร',
    district: 'เขตบางรัก',
    address: '114 ถนนนราธิวาสราชนครินทร์ แขวงสีลม เขตบางรัก กรุงเทพมหานคร',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-005',
    name: 'หอระฆังและหอกลอง',
    nameEn: 'Drum Tower',
    description: 'หอระฆังและหอกลองสมัยรัตนโกสินทร์ ตั้งอยู่ใกล้เขตพระนครและพระบรมมหาราชวัง เป็นโบราณสถานสำคัญสะท้อนประวัติศาสตร์ไทยและสถาปัตยกรรมดั้งเดิม',
    coordinates: {
      latitude: 13.7502,
      longitude: 100.4974
    },
    category: 'historical',
    province: 'กรุงเทพมหานคร',
    district: 'เขตพระนคร',
    address: 'ถนนบวรนิเวศ แขวงบวรนิเวศ เขตพระนคร กรุงเทพมหานคร',
    checkInRadius: 50,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-006',
    name: 'อาร์วอล์ก (ราชประสงค์ สกายวอล์ก)',
    nameEn: 'R Walk (Ratchaprasong SkyWalk)',
    description: 'สะพานลอยคนเดินเชื่อมต่อศูนย์การค้าชื่อดัง เช่น สยามพารากอน และเซ็นทรัลเวิลด์ เดินและถ่ายรูปเมืองได้โดยไม่ต้องกังวลรถติด มุมมองเมืองสวยงามโดยเฉพาะช่วงเย็น',
    coordinates: {
      latitude: 13.7472,
      longitude: 100.5394
    },
    category: 'other', // shopping -> other
    province: 'กรุงเทพมหานคร',
    district: 'เขตปทุมวัน',
    address: 'ถนนราชประสงค์ แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-007',
    name: 'อาคารจีเอ็มเอ็ม แกรมมี่ เพลส',
    nameEn: 'GMM Grammy Place Building',
    description: 'สำนักงานใหญ่ของ GMM Grammy บริษัทบันเทิงที่ใหญ่ที่สุดในประเทศไทย มีร้านอาหาร, คาเฟ่, และร้านค้าหลากหลาย',
    coordinates: {
      latitude: 13.7400,
      longitude: 100.5600
    },
    category: 'other', // entertainment -> other
    province: 'กรุงเทพมหานคร',
    district: 'เขตคลองเตย',
    address: '50 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพมหานคร',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-008',
    name: 'พระบรมมหาราชวัง',
    nameEn: 'Grand Palace',
    description: 'พระราชวังที่งดงามที่สุดของประเทศไทย สร้างขึ้นเมื่อปี 1782 แสดงศิลปะและสถาปัตยกรรมไทยชั้นสูง รวมถึงวัดพระศรีรัตนศาสดาราม (วัดพระแก้ว) ที่ประดิษฐานพระพุทธมหามณีรัตนปฏิมากร เป็นจุดถ่ายรูปสำคัญและศูนย์กลางวัฒนธรรมไทย ตั้งอยู่ใกล้แม่น้ำเจ้าพระยา เปิดให้เข้าชมทุกวัน (ต้องแต่งกายสุภาพ)',
    coordinates: {
      latitude: 13.7500,
      longitude: 100.4925
    },
    category: 'historical',
    province: 'กรุงเทพมหานคร',
    district: 'เขตพระนคร',
    address: 'ถนนหน้าพระลาน แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพมหานคร',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-009',
    name: 'วัดพระศรีรัตนศาสดาราม (วัดพระแก้ว)',
    nameEn: 'Wat Phra Kaew (Temple of the Emerald Buddha)',
    description: 'วัดที่สำคัญที่สุดของประเทศไทย ตั้งอยู่ในเขตพระบรมมหาราชวัง ประดิษฐานพระพุทธมหามณีรัตนปฏิมากร (พระแก้วมรกต) อัญมณีแห่งชาติ มีจิตรกรรมฝาผนังภาพรามเกียรติ์ เป็นสถานที่ศักดิ์สิทธิ์สำหรับคนไทยและนักท่องเที่ยว',
    coordinates: {
      latitude: 13.7500,
      longitude: 100.4925
    },
    category: 'temple',
    province: 'กรุงเทพมหานคร',
    district: 'เขตพระนคร',
    address: 'ถนนหน้าพระลาน แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพมหานคร',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-010',
    name: 'วัดอรุณราชวราราม',
    nameEn: 'Wat Arun Ratchawararam',
    description: 'วัดริมแม่น้ำเจ้าพระยาที่สวยงามเป็นสัญลักษณ์ โดยเฉพาะตอนพระอาทิตย์ตก โดดเด่นด้วยพระปรางค์สูงประดับกระเบื้องเคลือบหลากสี มุมมอง 360 องศาของแม่น้ำและกรุงเทพ',
    coordinates: {
      latitude: 13.7439,
      longitude: 100.4889
    },
    category: 'temple',
    province: 'กรุงเทพมหานคร',
    district: 'เขตบางกอกใหญ่',
    address: '158 ถนนวังเดิม แขวงวัดอรุณ เขตบางกอกใหญ่ กรุงเทพมหานคร',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-011',
    name: 'วัดโพธิ์',
    nameEn: 'Wat Pho',
    description: 'วัดที่มีพระพุทธไสยาสน์ที่ใหญ่ที่สุดในกรุงเทพ (ยาว 46 เมตร) เป็นแหล่งกำเนิดนวดแผนไทย มีโรงเรียนนวดในวัด บรรยากาศสงบร่มรื่น ล้อมรอบด้วยเจดีย์และพระพุทธรูปหลายพันองค์ ตั้งอยู่ใกล้พระบรมมหาราชวังและท่าเตียน',
    coordinates: {
      latitude: 13.7466,
      longitude: 100.4944
    },
    category: 'temple',
    province: 'กรุงเทพมหานคร',
    district: 'เขตพระนคร',
    address: '2 ถนนสมเด็จเจ้าพระยา แขวงวัดพระสิงห์ เขตพระนคร กรุงเทพมหานคร',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-012',
    name: 'ตลาดนัดจตุจักร',
    nameEn: 'Chatuchak Weekend Market',
    description: 'ตลาดที่ใหญ่ที่สุดในประเทศไทย มีร้านค้ามากกว่า 15,000 ร้าน มีทุกอย่างตั้งแต่เสื้อผ้า, ของตกแต่งบ้าน, สัตว์เลี้ยง, และอาหารท้องถิ่น เปิดทุกวันเสาร์-อาทิตย์ (บางโซนเปิดวันศุกร์)',
    coordinates: {
      latitude: 13.7986,
      longitude: 100.5522
    },
    category: 'market',
    province: 'กรุงเทพมหานคร',
    district: 'เขตจตุจักร',
    address: 'ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-013',
    name: 'สยามพารากอน',
    nameEn: 'Siam Paragon',
    description: 'ศูนย์การค้าลักซ์ชูรี่ใจกลางกรุงเทพ เป็นศูนย์รวมแบรนด์ระดับโลก มีโรงภาพยนตร์, พิพิธภัณฑ์สัตว์น้ำ (SEA LIFE Bangkok Ocean World), โซนอาหารนานาชาติ, และจัดงานแฟชั่นและศิลปะ',
    coordinates: {
      latitude: 13.7461,
      longitude: 100.5347
    },
    category: 'other', // shopping -> other
    province: 'กรุงเทพมหานคร',
    district: 'เขตปทุมวัน',
    address: '991 ถนนพระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-014',
    name: 'ถนนข้าวสาร',
    nameEn: 'Khao San Road',
    description: 'ถนนยอดนิยมสำหรับนักท่องเที่ยวแบ็กแพ็ค มีที่พัก, ร้านอาหาร, คาเฟ่, บาร์, และร้านค้านานาชาติ เป็นจุดเริ่มต้นการท่องเที่ยวผจญภัยในกรุงเทพ คึกคักทั้งกลางวันและกลางคืน ใกล้กับวัดพระแก้ว, วัดโพธิ์ และสถานที่ท่องเที่ยวรัตนโกสินทร์อื่นๆ',
    coordinates: {
      latitude: 13.7583,
      longitude: 100.4969
    },
    category: 'historical', // culture -> historical
    province: 'กรุงเทพมหานคร',
    district: 'เขตพระนคร',
    address: 'ถนนข้าวสาร แขวงตลาดยอด เขตพระนคร กรุงเทพมหานคร',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-015',
    name: 'เอเชียทีค เดอะ ริเวอร์ฟร้อนท์',
    nameEn: 'Asiatique The Riverfront',
    description: 'ไลฟ์สไตล์มอลล์ริมแม่น้ำ บรรยากาศตลาดเก่าแบบโกดัง ผสมผสานร้านอาหารไทยและนานาชาติ มีชิงช้าสวรรค์ยักษ์ และโชว์คาบาเร่ต์ บรรยากาศโรแมนติกช่วงเย็น มีบริการเรือชัตเตอร์ฟรีจาก BTS สะพานตากสิน',
    coordinates: {
      latitude: 13.7100,
      longitude: 100.5067
    },
    category: 'other', // shopping -> other
    province: 'กรุงเทพมหานคร',
    district: 'เขตคลองสาน',
    address: '2194 ถนนเจริญกรุง แขวงวัดพระยาไกร เขตคลองสาน กรุงเทพมหานคร',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-016',
    name: 'วัดปริวาสราชสงคราม (วัดการ์ตูน)',
    nameEn: 'Wat Pariwat (Cartoon Temple)',
    description: 'มีชื่อเสียงในชื่อ "วัดการ์ตูน" เนื่องจากประดับปูนปั้นตัวละครยอดนิยม เช่น โดราเอม่อน, แฮร์รี่ พอตเตอร์, และนักฟุตบอล มีศิลปะร่วมสมัยในอุโบสถพร้อมพระพุทธรูปที่แปลกตา เหมาะสำหรับถ่ายรูปและชื่นชมศิลปะเฉพาะตัว ตั้งอยู่บนถนนพระราม 3',
    coordinates: {
      latitude: 13.6981,
      longitude: 100.5386
    },
    category: 'temple',
    province: 'กรุงเทพมหานคร',
    district: 'เขตบางคอแหลม',
    address: '449 ถนนพระราม 3 แขวงช่องนนทรี เขตยานนาวา กรุงเทพมหานคร',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-017',
    name: 'บางกระเจ้า (ปอดสีเขียวของกรุงเทพ)',
    nameEn: 'Bang Krachao (Green Lung of Bangkok)',
    description: 'รู้จักในชื่อ "ปอดสีเขียวของกรุงเทพ" เกาะกลางแม่น้ำเจ้าพระยามีเส้นทางจักรยาน, สวนป่า, และบรรยากาศชุมชน มีตลาดน้ำบางน้ำพุ่งทุกวันหยุดสุดสัปดาห์, คาเฟ่สวน, และจุดถ่ายรูปธรรมชาติ เหมาะสำหรับนักผจญภัยและผู้ที่ต้องการพักผ่อนใกล้เมือง',
    coordinates: {
      latitude: 13.6686,
      longitude: 100.5503
    },
    category: 'park', // nature -> park
    province: 'กรุงเทพมหานคร',
    district: 'เขตพระประแดง',
    address: 'บางกระเจ้า อำเภอพระประแดง จังหวัดสมุทรปราการ',
    checkInRadius: 500,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-018',
    name: 'พิพิธภัณฑ์บ้านบางเขน',
    nameEn: 'Baan Bangkhen Museum',
    description: 'พิพิธภัณฑ์ของสะสมวินเทจ มีของเล่น, ของใช้ในบ้านเก่า, รถยนต์คลาสสิก, และเครื่องใช้ไฟฟ้า ตกแต่งแบบเรโทร เหมาะสำหรับถ่ายรูปธีมและครอบครัว',
    coordinates: {
      latitude: 13.8678,
      longitude: 100.5458
    },
    category: 'museum',
    province: 'กรุงเทพมหานคร',
    district: 'เขตบางเขน',
    address: 'บางเขน กรุงเทพมหานคร',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-019',
    name: 'สวนสมเด็จพระนางเจ้าสิริกิติ์ฯ',
    nameEn: 'Queen Sirikit Park',
    description: 'สวนสาธารณะขนาดใหญ่เงียบสงบ เชื่อมต่อกับสวนจตุจักร มีสวนพฤกษศาสตร์และอุโมงค์ไม้ เหมาะสำหรับเดิน, ถ่ายรูป, และปิกนิก',
    coordinates: {
      latitude: 13.8083,
      longitude: 100.5508
    },
    category: 'park',
    province: 'กรุงเทพมหานคร',
    district: 'เขตจตุจักร',
    address: 'ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร',
    checkInRadius: 300,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-020',
    name: 'พิพิธภัณฑ์งู สยามเซอร์เพนทาเรียม',
    nameEn: 'Siam Serpentarium',
    description: 'ศูนย์การเรียนรู้งูแห่งแรกในเอเชีย มีนิทรรศการแบบโต้ตอบและโชว์งู เหมาะสำหรับครอบครัวและเด็กที่สนใจสัตว์หรือประสบการณ์แปลกใหม่',
    coordinates: {
      latitude: 13.7275,
      longitude: 100.5914
    },
    category: 'museum',
    province: 'กรุงเทพมหานคร',
    district: 'เขตประเวศ',
    address: '969 ถนนสุขุมวิท แขวงประเวศ เขตประเวศ กรุงเทพมหานคร',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-021',
    name: 'อุทยานเฉลิมกาญจนาภิเษก',
    nameEn: 'Chaloem Kanchanaphisek Park',
    description: 'สวนสาธารณะริมแม่น้ำเจ้าพระยา บรรยากาศเงียบสงบสวยงามช่วงเย็น มีวิวพระอาทิตย์ตกและสะพานข้ามแม่น้ำ',
    coordinates: {
      latitude: 13.7750,
      longitude: 100.4900
    },
    category: 'park',
    province: 'กรุงเทพมหานคร',
    district: 'เขตบางพลัด',
    address: 'ถนนจรัญสนิทวงศ์ แขวงบางพลัด เขตบางพลัด กรุงเทพมหานคร',
    checkInRadius: 200,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-022',
    name: 'ตลาดน้ำคลองลัดมะยม',
    nameEn: 'Khlong Lat Mayom Floating Market',
    description: 'ตลาดน้ำยอดนิยมสำหรับชาวกรุงเทพท้องถิ่น มีอาหารท้องถิ่น, ผลิตภัณฑ์ทำเอง, และผลไม้สด บรรยากาศอบอุ่นริมน้ำ เปิดเฉพาะวันเสาร์-อาทิตย์',
    coordinates: {
      latitude: 13.7681,
      longitude: 100.4286
    },
    category: 'market',
    province: 'กรุงเทพมหานคร',
    district: 'เขตตลิ่งชัน',
    address: 'ถนนบางกรวย-ไทรน้อย แขวงตลิ่งชัน เขตตลิ่งชัน กรุงเทพมหานคร',
    checkInRadius: 150,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bangkok-023',
    name: 'วัดราชนัดดารามวรวิหาร (โลหะปราสาท)',
    nameEn: 'Loha Prasat',
    description: 'ปราสาทโลหะเพียงแห่งเดียวในโลก สถาปัตยกรรมโลหะ 37 ยอด มีบรรยากาศเงียบสงบและประวัติศาสตร์ที่ยาวนาน ตั้งอยู่ใกล้สะพานหัน',
    coordinates: {
      latitude: 13.7522,
      longitude: 100.5011
    },
    category: 'temple',
    province: 'กรุงเทพมหานคร',
    district: 'เขตพระนคร',
    address: '2 ถนนมหาไชย แขวงสำราญราษฎร์ เขตพระนคร กรุงเทพมหานคร',
    checkInRadius: 100,
    thumbnail: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

module.exports = bangkokAttractions;
