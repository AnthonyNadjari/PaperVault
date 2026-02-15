import Tesseract from 'tesseract.js'

export async function runOCR(imageFile: File): Promise<string> {
  const { data } = await Tesseract.recognize(imageFile, 'fra+eng', {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        console.log('OCR progress:', Math.round(m.progress * 100), '%')
      }
    },
  })
  return data.text.trim()
}
