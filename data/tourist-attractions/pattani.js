// data/tourist-attractions/pattani.js
const pattaniAttractions = [
  { id: 'pattani-001', name: 'มัสยิดกลางจังหวัดปัตตานี', nameEn: 'Central Mosque of Pattani', description: 'มัสยิดที่สวยงามและเป็นสถานที่สำคัญ', coordinates: { latitude: 6.8667, longitude: 101.2500 }, category: 'temple', categories: ['temple', 'recommended'], province: 'ปัตตานี', district: 'อำเภอเมืองปัตตานี', address: 'อำเภอเมืองปัตตานี จังหวัดปัตตานี', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => pattaniAttractions.filter(a => a.isActive);
const getAttractionById = (id) => pattaniAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => pattaniAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { pattaniAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
