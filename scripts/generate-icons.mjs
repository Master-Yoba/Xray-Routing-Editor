import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { deflateSync } from 'zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const buildDir = join(rootDir, 'build')

mkdirSync(buildDir, { recursive: true })

const shapes = [
  [
    [0.5, 0.024],
    [0.615, 0.388],
    [0.5, 0.322],
    [0.385, 0.388]
  ],
  [
    [0.976, 0.5],
    [0.612, 0.615],
    [0.678, 0.5],
    [0.612, 0.385]
  ],
  [
    [0.5, 0.976],
    [0.385, 0.612],
    [0.5, 0.678],
    [0.615, 0.612]
  ],
  [
    [0.024, 0.5],
    [0.388, 0.385],
    [0.322, 0.5],
    [0.388, 0.615]
  ]
]

const pngSizes = [16, 32, 64, 128, 256, 512, 1024]
const pngs = new Map(pngSizes.map((size) => [size, createPng(size)]))

writeFileSync(join(buildDir, 'icon.png'), pngs.get(512))
writeFileSync(join(buildDir, 'icon.ico'), createIco([16, 32, 64, 128, 256].map((size) => [size, pngs.get(size)])))
writeFileSync(
  join(buildDir, 'icon.icns'),
  createIcns([
    ['icp4', pngs.get(16)],
    ['icp5', pngs.get(32)],
    ['icp6', pngs.get(64)],
    ['ic07', pngs.get(128)],
    ['ic08', pngs.get(256)],
    ['ic09', pngs.get(512)],
    ['ic10', pngs.get(1024)]
  ])
)

function createPng(size) {
  const data = Buffer.alloc(size * (size * 4 + 1))
  let offset = 0

  for (let y = 0; y < size; y++) {
    data[offset++] = 0
    for (let x = 0; x < size; x++) {
      const alpha = sampleAlpha(x, y, size)
      data[offset++] = 0
      data[offset++] = 0
      data[offset++] = 0
      data[offset++] = alpha
    }
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', createIhdr(size, size)),
    chunk('IDAT', deflateSync(data)),
    chunk('IEND', Buffer.alloc(0))
  ])
}

function sampleAlpha(x, y, size) {
  let hits = 0
  const samplesPerAxis = 4
  const total = samplesPerAxis * samplesPerAxis

  for (let sy = 0; sy < samplesPerAxis; sy++) {
    for (let sx = 0; sx < samplesPerAxis; sx++) {
      const nx = (x + (sx + 0.5) / samplesPerAxis) / size
      const ny = (y + (sy + 0.5) / samplesPerAxis) / size
      if (shapes.some((shape) => pointInPolygon(nx, ny, shape))) hits++
    }
  }

  return Math.round((hits / total) * 255)
}

function pointInPolygon(x, y, polygon) {
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }

  return inside
}

function createIhdr(width, height) {
  const buf = Buffer.alloc(13)
  buf.writeUInt32BE(width, 0)
  buf.writeUInt32BE(height, 4)
  buf[8] = 8
  buf[9] = 6
  buf[10] = 0
  buf[11] = 0
  buf[12] = 0
  return buf
}

function createIco(entries) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)

  const directory = Buffer.alloc(entries.length * 16)
  const images = []
  let offset = header.length + directory.length

  entries.forEach(([size, png], index) => {
    const dirOffset = index * 16
    directory[dirOffset] = size === 256 ? 0 : size
    directory[dirOffset + 1] = size === 256 ? 0 : size
    directory[dirOffset + 2] = 0
    directory[dirOffset + 3] = 0
    directory.writeUInt16LE(1, dirOffset + 4)
    directory.writeUInt16LE(32, dirOffset + 6)
    directory.writeUInt32LE(png.length, dirOffset + 8)
    directory.writeUInt32LE(offset, dirOffset + 12)
    images.push(png)
    offset += png.length
  })

  return Buffer.concat([header, directory, ...images])
}

function createIcns(entries) {
  const chunks = entries.map(([type, png]) => {
    const header = Buffer.alloc(8)
    header.write(type, 0, 4, 'ascii')
    header.writeUInt32BE(png.length + 8, 4)
    return Buffer.concat([header, png])
  })

  const totalLength = 8 + chunks.reduce((sum, chunkBuf) => sum + chunkBuf.length, 0)
  const fileHeader = Buffer.alloc(8)
  fileHeader.write('icns', 0, 4, 'ascii')
  fileHeader.writeUInt32BE(totalLength, 4)
  return Buffer.concat([fileHeader, ...chunks])
}

function chunk(type, payload) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const lengthBuffer = Buffer.alloc(4)
  lengthBuffer.writeUInt32BE(payload.length, 0)
  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, payload])), 0)
  return Buffer.concat([lengthBuffer, typeBuffer, payload, crcBuffer])
}

function crc32(buffer) {
  let crc = 0xffffffff

  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }

  return (crc ^ 0xffffffff) >>> 0
}
