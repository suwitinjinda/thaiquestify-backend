// data/tourist-attractions/prachin-buri.js
const prachinBuriAttractions = [
  { id: 'prachin-buri-001', name: 'วัดแก้วพิจิตร', nameEn: 'Wat Kaeo Phichit', description: 'วัดเก่าแก่ที่มีสถาปัตยกรรมที่สวยงาม', coordinates: { latitude: 14.0500, longitude: 101.3667 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'ปราจีนบุรี', district: 'อำเภอเมืองปราจีนบุรี', address: 'อำเภอเมืองปราจีนบุรี จังหวัดปราจีนบุรี', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'prachin-buri-002', name: 'อุทยานแห่งชาติทับลาน', nameEn: 'Thap Lan National Park', description: 'อุทยานแห่งชาติที่มีธรรมชาติสวยงาม', coordinates: { latitude: 14.2000, longitude: 101.5000 }, category: 'park', categories: ['park', 'recommended'], province: 'ปราจีนบุรี', district: 'อำเภอวังน้ำเขียว', address: 'อำเภอวังน้ำเขียว จังหวัดปราจีนบุรี', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => prachinBuriAttractions.filter(a => a.isActive);
const getAttractionById = (id) => prachinBuriAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => prachinBuriAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { prachinBuriAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
