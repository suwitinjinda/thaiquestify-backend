# Tourist Attractions Data

Folder นี้เก็บข้อมูลสถานที่ท่องเที่ยวแต่ละจังหวัด สำหรับใช้ในเควส Check-in

## Structure

```
tourist-attractions/
├── index.js              # Main export file
├── samut-prakan.js       # สถานที่ท่องเที่ยวจังหวัดสมุทรปราการ
└── README.md            # Documentation
```

## Usage

### Import

```javascript
const attractions = require('./data/tourist-attractions');

// Get all attractions in Samut Prakan
const samutPrakanAttractions = attractions.samutPrakan.getAllActiveAttractions();

// Get attraction by ID
const attraction = attractions.getAttractionById('samut-prakan-001');

// Search attractions
const results = attractions.searchAttractions('เมืองโบราณ');

// Get by province
const provinceAttractions = attractions.getAttractionsByProvince('สมุทรปราการ');

// Get by category
const temples = attractions.getAttractionsByCategory('temple');
```

### Data Structure

แต่ละสถานที่ท่องเที่ยวมีโครงสร้างดังนี้:

```javascript
{
  id: 'samut-prakan-001',                    // Unique ID
  name: 'เมืองโบราณ',                        // ชื่อภาษาไทย
  nameEn: 'Ancient City',                    // ชื่อภาษาอังกฤษ
  description: '...',                        // คำอธิบาย
  coordinates: {
    latitude: 13.5367,                       // ละติจูด
    longitude: 100.6239                      // ลองจิจูด
  },
  category: 'historical',                    // หมวดหมู่ (historical, temple, museum, zoo, market, etc.)
  province: 'สมุทรปราการ',                   // จังหวัด
  district: 'อำเภอเมืองสมุทรปราการ',          // อำเภอ
  address: '...',                            // ที่อยู่เต็ม
  checkInRadius: 100,                        // รัศมีการเช็คอิน (เมตร)
  thumbnail: null,                           // URL รูปภาพ
  isActive: true,                            // สถานะ (เปิด/ปิด)
  createdAt: new Date(),                     // วันที่สร้าง
  updatedAt: new Date()                      // วันที่อัปเดตล่าสุด
}
```

## Adding New Provinces

เมื่อต้องการเพิ่มจังหวัดใหม่:

1. สร้างไฟล์ใหม่ใน folder นี้ เช่น `chiang-mai.js`
2. ใช้โครงสร้างเดียวกับ `samut-prakan.js`
3. Export data และ helper functions
4. เพิ่มใน `index.js`:
   - Import ไฟล์ใหม่
   - เพิ่มใน `attractionsByProvince`
   - เพิ่มใน `allProvinces` array
   - อัปเดต functions ที่เกี่ยวข้อง

## Categories

- `historical` - สถานที่ประวัติศาสตร์
- `temple` - วัด/ศาสนสถาน
- `museum` - พิพิธภัณฑ์
- `zoo` - สวนสัตว์
- `market` - ตลาด
- `park` - สวนสาธารณะ
- `beach` - หาด
- `mountain` - ภูเขา
- `waterfall` - น้ำตก
- `other` - อื่นๆ
