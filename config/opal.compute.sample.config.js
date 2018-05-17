const {Constants}  =  require('eae-utils');

module.exports = {
    mongoURL: 'mongodb://localhost/opal',
    postgresURL: 'postgres://postgres@timescaledb/opal',
    port: 80,
    enableCors: true,
    computeType: [Constants.EAE_COMPUTE_TYPE_PYTHON2],
    opalAlgoServiceURL: 'http://algoservice:3001',
    opalAggPrivServiceURL: 'http://aggandprivacy:9001'
};
