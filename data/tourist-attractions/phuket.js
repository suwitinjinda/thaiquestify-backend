// data/tourist-attractions/phuket.js
const phuketAttractions = [
  { id: 'phuket-001', name: 'หาดป่าตอง', nameEn: 'Patong Beach', description: 'หาดทรายที่สวยงามและเป็นที่นิยมมากที่สุดของภูเก็ต', coordinates: { latitude: 7.8833, longitude: 98.2833 }, category: 'beach', categories: ['beach', 'recommended'], province: 'ภูเก็ต', district: 'อำเภอกะทู้', address: 'อำเภอกะทู้ จังหวัดภูเก็ต', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'phuket-002', name: 'หาดกะตะ', nameEn: 'Kata Beach', description: 'หาดทรายที่สวยงามและเงียบสงบ', coordinates: { latitude: 7.8167, longitude: 98.3000 }, category: 'beach', categories: ['beach', 'recommended'], province: 'ภูเก็ต', district: 'อำเภอกะทู้', address: 'อำเภอกะทู้ จังหวัดภูเก็ต', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'phuket-003', name: 'วัดฉลอง', nameEn: 'Wat Chalong', description: 'วัดสำคัญของภูเก็ต', coordinates: { latitude: 7.8333, longitude: 98.3333 }, category: 'temple', categories: ['temple', 'historical', 'recommended'], province: 'ภูเก็ต', district: 'อำเภอเมืองภูเก็ต', address: 'อำเภอเมืองภูเก็ต จังหวัดภูเก็ต', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => phuketAttractions.filter(a => a.isActive);
const getAttractionById = (id) => phuketAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => phuketAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { phuketAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
