import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupPlaces, realText } from '../lib/places.ts'

const trip = (slug: string, name: string, destination: string, date: string | null) => ({ slug, name, destination, date } as any)

test('visits to the same place group together, newest first',()=>{const places=groupPlaces([trip('a','Rajgad Fort','Rajgad Fort','2023-07-09'),trip('b','Torna','Torna',null),trip('c','Rajgad sunrise',' rajgad  fort ','2026-08-15')]);assert.deepEqual(places.map(p=>p.name),['Rajgad Fort','Torna']);assert.deepEqual(places[0].visits.map(v=>v.slug),['c','a'])})
test('undated visits sort after dated ones',()=>{const [place]=groupPlaces([trip('a','Rajgad','Rajgad',null),trip('b','Rajgad','Rajgad','2024-01-01')]);assert.deepEqual(place.visits.map(v=>v.slug),['b','a'])})
test('trips without a real destination group by name',()=>{const places=groupPlaces([trip('a','Devkund Waterfall','Location not recorded',null),trip('b','Devkund Waterfall','',null)]);assert.equal(places.length,1);assert.equal(places[0].name,'Devkund Waterfall')})
test('placeholder text is hidden',()=>{assert.equal(realText('From the community’s original Rajgad Fort photo archive.'),'');assert.equal(realText(' Rajgad '),'Rajgad')})
test('initiatives stay separate even when they share a location',()=>{const places=groupPlaces([{...trip('a','Hill Cleaning Initiatives','Pune hills',null),kind:'initiative'},{...trip('b','Tree Plantation Initiatives','Pune hills',null),kind:'initiative'}]);assert.deepEqual(places.map(p=>p.name).sort(),['Hill Cleaning Initiatives','Tree Plantation Initiatives'])})
