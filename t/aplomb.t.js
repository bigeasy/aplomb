var monotonic = require('monotonic')
require('proof')(13, prove)

function prove(assert) {
    var Aplomb = require('..'),
        delegates = [
            'http://192.168.0.14:8080',
            'http://192.168.0.14:5432/blah/two',
            'http://192.168.0.14:2345'
        ],
        aplomb = new Aplomb({
            incrementVersion: function (x) {return x + 1},
            compare: function (a, b) {
                return a - b
            },
            extract: function (obj) {
                return obj.username + ':' + obj.password
            }
        }), table, distribution

    delegates.forEach(function (del, i) {
        table = aplomb.addDelegate(del)
        console.log(table)
        aplomb.addDelegation(table, i + 1)
    })

    table = aplomb.delegations.max().table,
    distribution = Math.floor(256, table.delegates.length)

    assert(table.buckets[120].url, delegates[1], 'true')

    table = aplomb.addDelegate('http://192.173.0.14:2381')
    aplomb.addDelegation(table, 4)
    table = aplomb.addDelegate('http://192.173.0.14:2382')
    aplomb.addDelegation(table, 5)

    assert(aplomb.delegations.max().table.delegates.indexOf('http://192.173.0.14:2381') > -1,
    'delegate added')

    var indices = 0, table = aplomb.delegations.max().table
    for (var b in table.buckets) {
        if (table.buckets[b].url == 'http://192.173.0.14:2381') {
            indices++
        }
    }

    assert((indices == 51), 'buckets redistributed')

    table = aplomb.replaceDelegate('http://192.173.0.14:2382', 'http://192.173.0.14:2383')
    aplomb.addDelegation(table, 6)

    assert(aplomb.delegations.max().table.delegates.indexOf('http://192.173.0.14:2382') == -1, 'delegate replaced')

    table = aplomb.removeDelegate('http://192.173.0.14:2381')
    aplomb.addDelegation(table, 7)
    table = aplomb.removeDelegate('http://192.173.0.14:2383')
    aplomb.addDelegation(table, 8)

    assert((aplomb.delegations.max().key == 8), 'version incremented')

    assert((distribution == Math.floor(256, aplomb.delegations.max().table.delegates.length)),
    'distribution reproduced')

    var b = aplomb.connectionTree(12)

    assert((b.key == 12), 'generated connection table')


    aplomb.addConnection(1, { username: 'user', password: 'pass' })

    aplomb.addConnection(2, { username: 'user', password: 'pass' })
    aplomb.addConnection(2, { username: 'user', password: 'pass' })

    aplomb.addConnection(6, { username: 'userr', password: 'ppass' })
    aplomb.addConnection(6, { username: 'fewer', password: 'sass' })

    aplomb.removeConnection({ username: 'fewer', password: 'sass' })

    aplomb.addConnection(6, { username: 'bluer', password: 'sass' })

    aplomb.removeConnection({ username: 'user', password: 'pass' })

    assert((aplomb.connections.size == 3), 'trees generated')
    aplomb.addConnection(2, { username: 'user', password: 'pass' })
    aplomb.addConnection(2, { username: 'userr', password: 'ppass' })

    assert((aplomb.connections.max().key == 6), 'connection version\
    managed')

    assert((delegates.indexOf(aplomb.getDelegates({username : 'bluer', password:
    'sass'})[0]) > -1), 'matched')

    var evict = aplomb.evictable('http://192.168.0.14:8080')

    console.log('evicted', evict)

    assert(aplomb.getDelegationKeys(), [ 8, 7, 6, 5, 4, 3, 2, 1 ], 'keys')
    assert(!!aplomb.removeDelegation(1), 'remove delegation')
    assert(!aplomb.removeDelegation(1), 'remove delegation does not exist')

    /*
    assert((evict.username == 'user'), 'evicted old')

    assert((aplomb.getConnection({username: 'user', password: 'pass'}).username
    == 'user'), 'got connection')

    assert((aplomb.getConnection({}) == null), 'not found')

    for (var e, del = 0, I = delegates.length; del < I; del++) {
        while (e = aplomb.evictable(delegates[del])) {
            console.log('evicting', e)
            aplomb.removeConnection(e)
        }
        assert((aplomb.evictable(delegates[del]) == null), 'all evicted')
    }

    assert(aplomb.getTable({ version: monotonic.parse('2.0') }).version[0] == 2, 'fetched table')
    */
}
