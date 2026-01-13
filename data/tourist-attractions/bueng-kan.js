// data/tourist-attractions/bueng-kan.js
const buengKanAttractions = [
  { id: 'bueng-kan-001', name: 'หินสามวาฬ', nameEn: 'Hin Sam Wan', description: 'หินขนาดใหญ่สามก้อนที่มีรูปร่างคล้ายวาฬ ตั้งอยู่บนภูสิงห์', coordinates: { latitude: 18.3667, longitude: 103.6500 }, category: 'other', categories: ['other', 'recommended'], province: 'บึงกาฬ', district: 'อำเภอภูสิงห์', address: 'อำเภอภูสิงห์ จังหวัดบึงกาฬ', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => buengKanAttractions.filter(a => a.isActive);
const getAttractionById = (id) => buengKanAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => buengKanAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { buengKanAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
