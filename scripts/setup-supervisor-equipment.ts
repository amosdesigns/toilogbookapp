/**
 * Setup script for supervisor equipment workflow
 * Creates HQ location and sample equipment if they don't exist
 */

import 'dotenv/config'
import '../prisma.config' // Load Prisma 7 config
import { prisma } from '../lib/prisma'

async function main() {
  console.log('🚀 Setting up supervisor equipment workflow...\n')

  // 1. Check/Create HQ Location
  console.log('📍 Checking HQ location...')
  let hqLocation = await prisma.location.findFirst({
    where: { name: 'HQ - Headquarters' }
  })

  if (!hqLocation) {
    console.log('  Creating HQ location...')
    hqLocation = await prisma.location.create({
      data: {
        name: 'HQ - Headquarters',
        description: 'Supervisor starting location',
        address: 'Town of Islip Marina Office, Islip, NY',
        isActive: true,
      }
    })
    console.log('  ✅ HQ location created')
  } else {
    console.log('  ✅ HQ location already exists')
  }

  // 2. Check/Create Sample Cars
  console.log('\n🚗 Setting up cars...')
  const carIdentifiers = ['TOI-001', 'TOI-002', 'TOI-003']

  for (const identifier of carIdentifiers) {
    const existingCar = await prisma.supervisorEquipment.findUnique({
      where: {
        type_identifier: {
          type: 'CAR',
          identifier
        }
      }
    })

    if (!existingCar) {
      await prisma.supervisorEquipment.create({
        data: {
          type: 'CAR',
          identifier,
          isAvailable: true
        }
      })
      console.log(`  ✅ Car ${identifier} created`)
    } else {
      console.log(`  ✅ Car ${identifier} already exists`)
    }
  }

  // 3. Check/Create Sample Radios
  console.log('\n📻 Setting up radios...')
  const radioIdentifiers = ['Radio-1', 'Radio-2', 'Radio-3', 'Radio-4', 'Radio-5']

  for (const identifier of radioIdentifiers) {
    const existingRadio = await prisma.supervisorEquipment.findUnique({
      where: {
        type_identifier: {
          type: 'RADIO',
          identifier
        }
      }
    })

    if (!existingRadio) {
      await prisma.supervisorEquipment.create({
        data: {
          type: 'RADIO',
          identifier,
          isAvailable: true
        }
      })
      console.log(`  ✅ Radio ${identifier} created`)
    } else {
      console.log(`  ✅ Radio ${identifier} already exists`)
    }
  }

  // 4. Summary
  console.log('\n📊 Summary:')
  const totalCars = await prisma.supervisorEquipment.count({
    where: { type: 'CAR' }
  })
  const totalRadios = await prisma.supervisorEquipment.count({
    where: { type: 'RADIO' }
  })
  const availableCars = await prisma.supervisorEquipment.count({
    where: { type: 'CAR', isAvailable: true }
  })
  const availableRadios = await prisma.supervisorEquipment.count({
    where: { type: 'RADIO', isAvailable: true }
  })

  console.log(`  Cars: ${totalCars} total (${availableCars} available)`)
  console.log(`  Radios: ${totalRadios} total (${availableRadios} available)`)
  console.log(`  HQ Location: ${hqLocation.name} (ID: ${hqLocation.id})`)

  console.log('\n✅ Setup complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
