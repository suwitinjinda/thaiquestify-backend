/**
 * Road Distance Service – ใช้ Google Distance Matrix API ดึงระยะทางบนถนน (driving)
 * สำหรับคิดค่าจัดส่ง (delivery fee) ให้ตรงกับระยะจริงที่ rider ต้องวิ่ง
 *
 * ต้องตั้ง GOOGLE_MAPS_API_KEY ใน environment (ใช้ key เดียวกับ Maps/Distance Matrix ได้)
 */
const axios = require('axios');

const DISTANCE_MATRIX_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';

/**
 * ดึงระยะทางบนถนน (กม.) ระหว่าง origin กับ destination
 * @param {{ latitude: number, longitude: number }} origin - พิกัดต้นทาง (เช่น ร้าน)
 * @param {{ latitude: number, longitude: number }} destination - พิกัดปลายทาง (เช่น ที่อยู่ลูกค้า)
 * @returns {Promise<number|null>} ระยะทางเป็นกม. หรือ null ถ้าไม่มี key / API ล้มเหลว
 */
async function getRoadDistanceKm(origin, destination) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!origin?.latitude || !origin?.longitude || !destination?.latitude || !destination?.longitude) {
    return null;
  }

  const originStr = `${origin.latitude},${origin.longitude}`;
  const destStr = `${destination.latitude},${destination.longitude}`;

  try {
    const res = await axios.get(DISTANCE_MATRIX_URL, {
      params: {
        origins: originStr,
        destinations: destStr,
        mode: 'driving',
        language: 'th',
        key: apiKey,
      },
      timeout: 10000,
    });

    if (res.data.status !== 'OK' || !res.data.rows?.[0]?.elements?.[0]) {
      return null;
    }

    const el = res.data.rows[0].elements[0];
    if (el.status !== 'OK' || !el.distance?.value) {
      return null;
    }

    return el.distance.value / 1000; // meters → km
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[roadDistanceService] Distance Matrix error:', err.message);
    }
    return null;
  }
}

module.exports = {
  getRoadDistanceKm,
};
