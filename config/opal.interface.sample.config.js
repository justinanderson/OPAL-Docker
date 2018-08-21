module.exports = {
    mongoURL: 'mongodb://mongodb/opal',
    port: 80,
    enableCors: true,
    cacheURL: 'http://cache:80',
    algoServiceURL: 'http://algoservice:80',
    algorithmsDirectory: '/usr/app/algorithms',
    auditDirectory: '/usr/app/audit',
    quotasRefreshPeriod: 7,
    ethereum: {
        enabled: false,
        url: '',
        account: '',
        password: '',
        gasPrice: 0,
        contract: {
            "abi": [],
            "address": ""
        }
    }

};
