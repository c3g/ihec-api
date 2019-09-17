/*
 * constants.js
 */

const DEFAULT_ASSAY = 'Unknown'
const DEFAULT_CELL_TYPE = 'Other'
const DEFAULT_INSTITUTION_ID = 10 /* Other */
const DEFAULT_BUILD_NAME = '2018-10'

const SEARCH_KEYS = [
  'alignment_software',
  'alignment_software_version',
  'analysis_group',
  'analysis_software',
  'analysis_software_version',
  'experiment_ontology_uri',
  'experiment_type',
  'reference_registry_id',
  'biomaterial_type',
  'differentiation_stage',
  'disease',
  'disease_ontology_uri',
  'line',
  'lineage',
  'medium',
  'molecule',
  'publishing_group',
  'sample_ontology_uri',
  'sex',
  'id',
  'cell_type',
  'donor_age',
  'donor_age_unit',
  'donor_ethnicity',
  'donor_health_status',
  'donor_id',
  'donor_life_stage',
  'donor_sex',
  'experiment_id',
  'sample_id',
  'tissue_depot',
  'tissue_type',
  'assay_type',
  'cell_type_ontology_uri',
  'tissue_type_ontology_uri',
  'tissue_depot_ontology_uri',
  'releasing_group'
]

const GRID_RECORD_KEYS = [
    'id'
  , 'sampleID'
  , 'assay'
  , 'cell_type'
  , 'donorID'
  , 'epirr_id'
  , 'institution'
  , 'species'
  , 'source'
  , 'datasetID'
]

module.exports = {
    DEFAULT_ASSAY
  , DEFAULT_CELL_TYPE
  , DEFAULT_INSTITUTION_ID
  , DEFAULT_BUILD_NAME
  , SEARCH_KEYS
  , GRID_RECORD_KEYS
}
