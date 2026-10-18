import crewData from '../data/crew.json'
import { parseCrew } from './crew-schema'

// Volunteers shown on /crew. Add someone to data/crew.json only after they have agreed to be named (see crew-schema.ts).
export const crew = parseCrew(crewData)
