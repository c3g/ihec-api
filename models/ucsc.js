/*
 * ucsc.js
 */

const DataHubs = require('./dataHubs')
const Institution = require('./institutions')

module.exports = {
  generateHub,
  generateGenome,
  generateTracks,
}

function generateHub(session) {
  return unindent`
    hub DIGV_Hub
    shortLabel DIG Viewer Dynamic Track Hub (Session ID: ${session})
    longLabel DIG Viewer Dynamic Track Hub (Session ID: ${session})
    genomesFile genome?session=${session}
    email info@epigenomesportal.ca
  `
}

function generateGenome(session, assembly) {
  return unindent`
    genome ${assembly}
    trackDb track-db?session=${session}
  `
}

async function generateTracks(hubs) {

  const colorsByInstitution = await Institution.colorsByName()

  const compositeTracks = {}

  const compositeTrackBlocks = []
  const trackBlocks = []

  const assayTypes = new Set()
  const cellTypes  = new Set()

  DataHubs.forEachTrack(hubs, (track, type, dataset, id, sample, hub, i) => {

    const assayType = getAssayType(dataset)
    const cellType = getCellType(dataset, sample)
    const trackType = getTrackType(track)
    const institution = getInstitution(dataset, hub)
    const trackID = id.replace(/[^\w]/g, '_')

    const trackName = `${trackID}__${type}__${i}`
    const parentName = `${institution}__${assayType}`
    const visibility = 'on'
    const trackDensity = 'pack'

    const shortLabel = dataset.sample_id
    const longLabel = `${dataset.sample_id} (${cellType} - ${assayType})`

    compositeTracks[parentName] = { assayType, institution }

    assayTypes.add(assayType)
    cellTypes.add(cellType)

    trackBlocks.push(unindent`
      track ${trackName}
      type ${trackType}
      parent ${parentName} ${visibility}
      shortLabel ${shortLabel}
      longLabel ${longLabel}
      visibility ${trackDensity}
      bigDataUrl ${track.big_data_url}
      maxHeightPixels 25:25:8
      autoScale on
      subGroups cellType=${cellType} assayType=${assayType} view=${type}
    `)
  })

  const subGroup1 = 'subGroup1 cellType  Cell_Type '   + Array.from(cellTypes).map(n => n + '=' + n).join(' ')
  const subGroup2 = 'subGroup2 assayType Assay_Type '  + Array.from(assayTypes).map(n => n + '=' + n).join(' ')

  Object.entries(compositeTracks).forEach(([trackName, { assayType, institution }]) => {
    compositeTrackBlocks.push(unindent`
      track ${trackName}
      compositeTrack on
      shortLabel ${trackName}
      longLabel ${assayType} (${institution})
      ${subGroup1}
      ${subGroup2}
      subGroup3 view View peak_calls=Peak_Calls signal=Signal signal_forward=Signal_Forward signal_reverse=Signal_Reverse methylation_profile=Methylation_Profile
      dimensions dimensionX=assayType dimensionY=cellType dimA=view
      sortOrder assayType=+ cellType=+
      dividers assayType
      dragAndDrop subTracks
      priority 1
      type bed 5
      visibility pack
      color ${hexToRGB(colorsByInstitution[institution] || '888888')}
    `)
  })

  return (
      compositeTrackBlocks.join('\n\n')
    + '\n\n'
    + trackBlocks.map(block => indent(4, block)).join('\n    \n')
  )
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
