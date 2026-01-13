// data/tourist-attractions/samut-songkhram.js
const samutSongkhramAttractions = [
  { id: 'samut-songkhram-001', name: 'ตลาดน้ำอัมพวา', nameEn: 'Amphawa Floating Market', description: 'ตลาดน้ำที่ได้รับความนิยมมาก มีอาหารและสินค้าท้องถิ่น', coordinates: { latitude: 13.4167, longitude: 99.9500 }, category: 'market', categories: ['market', 'recommended'], province: 'สมุทรสงคราม', district: 'อำเภออัมพวา', address: 'อำเภออัมพวา จังหวัดสมุทรสงคราม', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'samut-songkhram-002', name: 'วัดอัมพวันเจติยาราม', nameEn: 'Wat Amphawan Chetiyaram', description: 'วัดที่เกี่ยวข้องกับรัชกาลที่ 2', coordinates: { latitude: 13.4200, longitude: 99.9550 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'สมุทรสงคราม', district: 'อำเภออัมพวา', address: 'อำเภออัมพวา จังหวัดสมุทรสงคราม', checkInRadius: 100, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => samutSongkhramAttractions.filter(a => a.isActive);
const getAttractionById = (id) => samutSongkhramAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => samutSongkhramAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { samutSongkhramAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
