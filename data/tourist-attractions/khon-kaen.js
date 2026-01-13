// data/tourist-attractions/khon-kaen.js
const khonKaenAttractions = [
  { id: 'khon-kaen-001', name: 'บึงแก่นนคร', nameEn: 'Bueng Kaen Nakhon', description: 'บึงน้ำขนาดใหญ่ใจกลางเมืองขอนแก่น', coordinates: { latitude: 16.4333, longitude: 102.8333 }, category: 'other', categories: ['other', 'recommended'], province: 'ขอนแก่น', district: 'อำเภอเมืองขอนแก่น', address: 'อำเภอเมืองขอนแก่น จังหวัดขอนแก่น', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'khon-kaen-002', name: 'วัดพระธาตุขามแก่น', nameEn: 'Wat Phra That Kham Kaen', description: 'วัดสำคัญที่มีพระธาตุขามแก่น', coordinates: { latitude: 16.4500, longitude: 102.8500 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'ขอนแก่น', district: 'อำเภอเมืองขอนแก่น', address: 'อำเภอเมืองขอนแก่น จังหวัดขอนแก่น', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => khonKaenAttractions.filter(a => a.isActive);
const getAttractionById = (id) => khonKaenAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => khonKaenAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { khonKaenAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
