// data/tourist-attractions/prachuap-khiri-khan.js
const prachuapKhiriKhanAttractions = [
  { id: 'prachuap-khiri-khan-001', name: 'หาดหัวหิน', nameEn: 'Hua Hin Beach', description: 'หาดทรายที่สวยงามและเป็นที่นิยมของนักท่องเที่ยว', coordinates: { latitude: 12.5667, longitude: 99.9500 }, category: 'beach', categories: ['beach', 'recommended'], province: 'ประจวบคีรีขันธ์', district: 'อำเภอหัวหิน', address: 'อำเภอหัวหิน จังหวัดประจวบคีรีขันธ์', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'prachuap-khiri-khan-002', name: 'เขาตะเกียบ', nameEn: 'Khao Takiab', description: 'เขาที่มีพระพุทธรูปขนาดใหญ่และจุดชมวิวสวยงาม', coordinates: { latitude: 12.5500, longitude: 99.9667 }, category: 'temple', categories: ['temple', 'mountain', 'recommended'], province: 'ประจวบคีรีขันธ์', district: 'อำเภอหัวหิน', address: 'อำเภอหัวหิน จังหวัดประจวบคีรีขันธ์', checkInRadius: 150, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'prachuap-khiri-khan-003', name: 'อุทยานแห่งชาติเขาสามร้อยยอด', nameEn: 'Khao Sam Roi Yot National Park', description: 'อุทยานแห่งชาติที่มีธรรมชาติสวยงามและถ้ำ', coordinates: { latitude: 12.1667, longitude: 99.9333 }, category: 'park', categories: ['park', 'beach', 'recommended'], province: 'ประจวบคีรีขันธ์', district: 'อำเภอปราณบุรี', address: 'อำเภอปราณบุรี จังหวัดประจวบคีรีขันธ์', checkInRadius: 200, thumbnail: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
];
const getAllActiveAttractions = () => prachuapKhiriKhanAttractions.filter(a => a.isActive);
const getAttractionById = (id) => prachuapKhiriKhanAttractions.find(a => a.id === id);
const getAttractionsByCategory = (category) => prachuapKhiriKhanAttractions.filter(a => a.isActive && (a.category === category || a.categories.includes(category)));
module.exports = { prachuapKhiriKhanAttractions, getAllActiveAttractions, getAttractionById, getAttractionsByCategory };
