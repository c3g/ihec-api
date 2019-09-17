/*
 * washu.js
 */


const DataHubs = require('./dataHubs')
const Institution = require('./institutions')

module.exports = {
  generateHub,
}

async function generateHub(hubs) {

  const colorsByInstitution = await Institution.colorsByName()

  const result = []

  DataHubs.forEachTrack(hubs, (track, type, dataset, id, sample, hub, i) => {
    const assayType = getAssayType(dataset)
    const cellType = getCellType(dataset, sample)
    const trackType = getTrackType(track)
    const institution = getInstitution(dataset, hub)
    const trackID = id.replace(/[^\w]/g, '_')

    result.push({
      type: trackType,
      url: track.big_data_url,
      name: `${trackID}.${assayType}.${trackID}`,
      mode: 'show',
      colorpositive: '#' + (colorsByInstitution[institution] || '888888'),
      height: 50,
    })
  })

  return result
}


function getTrackType(track) {
  if (/(\.bb)|(\.bigBed)$/.test(track.big_data_url))
    return 'bigBed'
  return 'bigWig'
}

function getAssayType(dataset) {
  let assayName = (
       (dataset.ihec_data_portal && dataset.ihec_data_portal.assay)
    || (dataset.experiment_attributes && dataset.experiment_attributes.experiment_type)
    || 'Unkown'
  )

  const replacements = {
      'dna methylation':         'wgb-seq'
    , 'control':                 'input'
    , 'chromatin accessibility': 'chromatin_acc'
    , 'h2a.zac':                 'h2a_zac'
    , 'h2afz':                   'h2a_zac'
    , 'h3k9/14ac':               'h3k9_14ac'
    , 'total-rna-seq':           'rna-seq'
    , 'total-rna-seq':           'rna-seq'
    , 'strandedtotalrna-seq':    'rna-seq'
    , 'nome seq':                'nome-seq'
  }

  if (assayName.toLowerCase() in replacements)
    assayName = replacements[assayName.toLowerCase()]
  else
    assayName = assayName.replace(/(histone|chip-seq) /i, '')

  return assayName.replace(/ /g, '_')
}

function getCellType(dataset, sample) {
  return (
       (dataset.ihec_data_portal && dataset.ihec_data_portal.cell_type)
    || (sample.cell_type)
    || 'Unkown'
  ).replace(/ /g, '_')
}

function getInstitution(dataset, hub) {
  return (
       (dataset.ihec_data_portal && dataset.ihec_data_portal.publishing_group)
    || (hub.data.hub_description.publishing_group)
    || 'Other'
  ).replace(/ /g, '_')
}

function hexToRGB(string) {
  const r = parseInt(string.slice(0, 2), 16)
  const g = parseInt(string.slice(2, 4), 16)
  const b = parseInt(string.slice(4, 6), 16)
  return [r, g, b].join(',')
}

function unindent(strings, ...args) {
  let result = ''
  for (let i = 0; i < strings.length; i++) {
    result += strings[i]
    if (i < args.length)
      result += args[i]
  }
  return result.replace(/^\s+/mg, '').replace(/\n+$/, '')
}

function indent(n, string) {
  return string.replace(/^/mg, ' '.repeat(n))
}
