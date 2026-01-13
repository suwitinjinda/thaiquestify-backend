// data/tourist-attractions/krabi.js
const krabiAttractions = [
  { id: 'krabi-001', name: 'หาดไร่เล', nameEn: 'Railay Beach', description: 'หาดทรายที่สวยงามและเป็นที่นิยม', coordinates: { latitude: 8.0167, longitude: 98.8333 }, category: 'beach', categories: ['beach', 'recommended'], province: 'กระบี่', district: 'อำเภอเมืองกระบี่', address: 'อำเภอเมืองกระบี่ จังหวัดกระบี่', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'krabi-002', name: 'เกาะพีพี', nameEn: 'Phi Phi Islands', description: 'เกาะที่สวยงามและเป็นที่นิยมมาก', coordinates: { latitude: 7.7333, longitude: 98.7667 }, category: 'beach', categories: ['beach', 'recommended'], province: 'กระบี่', district: 'อำเภอเมืองกระบี่', address: 'อำเภอเมืองกระบี่ จังหวัดกระบี่', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => krabiAttractions.filter(a => a.isActive);
const getAttractionById = (id) => krabiAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => krabiAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { krabiAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
