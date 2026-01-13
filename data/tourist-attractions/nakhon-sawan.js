// data/tourist-attractions/nakhon-sawan.js
const nakhonSawanAttractions = [
  { id: 'nakhon-sawan-001', name: 'พาสาน', nameEn: 'Pa San', description: 'จุดเช็คอินกลางน้ำที่ปากน้ำโพ เป็นสถานที่รวมตัวของแม่น้ำปิง วัง ยม และน่าน กำเนิดเป็นต้นสายแม่น้ำเจ้าพระยา', coordinates: { latitude: 15.7000, longitude: 100.1333 }, category: 'other', categories: ['other', 'recommended'], province: 'นครสวรรค์', district: 'อำเภอเมืองนครสวรรค์', address: 'อำเภอเมืองนครสวรรค์ จังหวัดนครสวรรค์', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'nakhon-sawan-002', name: 'วัดคีรีวงศ์และหอชมเมือง', nameEn: 'Wat Kiriwong and City View Tower', description: 'สามารถมองเห็นทัศนียภาพของเมืองนครสวรรค์ได้อย่างสวยงาม และมีพระจุฬามณีเจดีย์ตั้งอยู่บนยอดเขาดาวดึงส์', coordinates: { latitude: 15.7100, longitude: 100.1400 }, category: 'temple', categories: ['temple', 'recommended'], province: 'นครสวรรค์', district: 'อำเภอเมืองนครสวรรค์', address: 'อำเภอเมืองนครสวรรค์ จังหวัดนครสวรรค์', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => nakhonSawanAttractions.filter(a => a.isActive);
const getAttractionById = (id) => nakhonSawanAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => nakhonSawanAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { nakhonSawanAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
