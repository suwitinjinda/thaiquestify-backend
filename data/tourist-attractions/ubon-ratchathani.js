// data/tourist-attractions/ubon-ratchathani.js
const ubonRatchathaniAttractions = [
  { id: 'ubon-ratchathani-001', name: 'วัดพระธาตุหนองบัว', nameEn: 'Wat Phra That Nong Bua', description: 'วัดสำคัญที่มีพระธาตุหนองบัว', coordinates: { latitude: 15.2333, longitude: 104.8500 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'อุบลราชธานี', district: 'อำเภอเมืองอุบลราชธานี', address: 'อำเภอเมืองอุบลราชธานี จังหวัดอุบลราชธานี', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ubon-ratchathani-002', name: 'แก่งสะพือ', nameEn: 'Kaeng Saphue', description: 'แก่งน้ำในแม่น้ำมูลที่สวยงาม', coordinates: { latitude: 15.3000, longitude: 105.0000 }, category: 'other', categories: ['other', 'recommended'], province: 'อุบลราชธานี', district: 'อำเภอพิบูลมังสาหาร', address: 'อำเภอพิบูลมังสาหาร จังหวัดอุบลราชธานี', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => ubonRatchathaniAttractions.filter(a => a.isActive);
const getAttractionById = (id) => ubonRatchathaniAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => ubonRatchathaniAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { ubonRatchathaniAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
