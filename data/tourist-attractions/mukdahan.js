// data/tourist-attractions/mukdahan.js
const mukdahanAttractions = [
  { id: 'mukdahan-001', name: 'หอแก้วมุกดาหาร', nameEn: 'Ho Kaeo Mukdahan', description: 'หอชมเมืองที่สามารถมองเห็นวิวของแม่น้ำโขงและประเทศลาว', coordinates: { latitude: 16.5500, longitude: 104.7167 }, category: 'other', categories: ['other', 'recommended'], province: 'มุกดาหาร', district: 'อำเภอเมืองมุกดาหาร', address: 'อำเภอเมืองมุกดาหาร จังหวัดมุกดาหาร', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => mukdahanAttractions.filter(a => a.isActive);
const getAttractionById = (id) => mukdahanAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => mukdahanAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { mukdahanAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
