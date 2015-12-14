require('proof')(14, prove)

function prove(assert) {
    var Router = require('../../../aplomb.js')
    var delegates = [
            'http://192.168.0.14:8080',
            'http://192.168.0.14:5432/blah/two',
            'http://192.168.0.14:2345'
        ]
    var router = new Router({
        delegates: delegates,
        extract: function (obj) {
            return obj.username + ':' + obj.password
        },
        version: '1'//,
        //incrementVersion: function (x) {return x + 2}
    })
    var dist = Math.floor(256, router.routes[0].delegates.length)

    assert(router.routes[0].buckets[120].url, delegates[1], 'true')

    router.add('http://192.173.0.14:2381')
    router.add('http://192.173.0.14:2382')

    assert(router.routes[0].delegates.indexOf('http://192.173.0.14:2381') > -1,
    'delegate added')

    var indices = 0
    for (var b in router.routes[0].buckets) {
        if (router.routes[0].buckets[b].url == 'http://192.173.0.14:2381') {
            indices++
        }
    }

    assert((indices == 51), 'buckets redistributed')
    router.remove('http://192.173.0.14:2381')
    router.remove('http://192.173.0.14:2382')
    assert((router.routes[0].version == 5), 'version incremented')

    assert((dist == Math.floor(256, router.routes[0].delegates.length)),
    'distribution reproduced')


    router.addConnection('1', { username: 'user', password: 'pass' })
    router.addConnection('2', { username: 'user', password: 'pass' })
    router.addConnection('2', { username: 'user', password: 'pass' })
    router.addConnection('5', { username: 'userr', password: 'ppass' })
    router.addConnection('5', { username: 'fewer', password: 'sass' })

    router.removeConnection({ username: 'fewer', password: 'sass' })

    router.addConnection('5', { username: 'bluer', password: 'sass' })

    router.removeConnection({ username: 'user', password: 'pass' })

    assert((router.connections[0].connections.size == 2), 'tables shredded')
    router.addConnection('2', { username: 'user', password: 'pass' })
    router.addConnection('2', { username: 'userr', password: 'ppass' })

    assert((router.connections[0].version[0] == 5), 'connection version\
    managed')

    assert((delegates.indexOf(router.match({username : 'bluer', password:
    'sass'})[0]) > -1), 'matched')

    assert((router.evictable('http://192.168.0.14:8080').username == 'user'),
    'evicted old')

    assert((router.getConnection({username: 'user', password: 'pass'}).username
    == 'user'), 'got connection')

    assert((router.getConnection({}) == null), 'not found')

    for (var del = 0, I = delegates.length; del < I; del++) {
        var e
        while (e = router.evictable(delegates[del])) {
            router.removeConnection(e)
        }
        assert((router.evictable(delegates[del]) == null), 'all evicted')
    }
}
