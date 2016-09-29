#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
#  Retreive_from_couchdb.py
#
#  Copyright 2016 mounir <mounir@kali>
#
#  This program is free software; you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation; either version 2 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program; if not, write to the Free Software
#  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
#  MA 02110-1301, USA.
#
#

from neo4j.v1 import GraphDatabase,basic_auth
import Topology_Discovery as tp
import json
import ast



def query_scan(dev):

    query = '''MERGE (d:node { Hostinfo: %s,InterfacesScan:%s,Services: %s,Vuls: %s})''' %([str(dev['host'])],
                                                                                           [str(dev['interface'])],
                                                                                           [ str ( dev[ 'services' ] ) ],
                                                                                           [ str ( dev[ 'vuls' ] ) ])
    return query


def insert_to_db(cred,insert_query):
    driver = GraphDatabase.driver ( cred[ 0 ],auth=basic_auth ( cred[ 2 ],cred[ 1 ] ) )
    session = driver.session ( )
    # session.run ( insert_query[ 0 ],parameters={"host": insert_query[ 1 ]} )
    session.run ( insert_query)
    session.close ( )
    return 0


def verify_snmp(device,snmp_info):
    for dev in snmp_info:
        for interface in dev[ 'interfaces' ]:
            if interface[ 'ipaddress' ] == device[ 0 ]:
                if interface[ 'mac' ] == device[ 1 ] or device[ 1 ] == '0x000000000000':
                    return [ True,dev ]

    return [ False,None ]


def verify_scan(device,scan_info):
    for dev in scan_info:
        if dev[ 'interface' ][ 'address' ] == device[ 0 ]:
            if dev[ 'interface' ][ 'mac' ] == device[ 1 ] or device[ 1 ] == '0x000000000000':
                return [ True,dev ]
            if dev[ 'interface' ][ 'mac' ] == '0x000000000000':
                dev[ 'interface' ][ 'mac' ] = device[ 1 ]
                return [ True,dev ]

    return [ False,None ]


def query_snmp ( dev):
    query = '''MERGE (d:node {SystemInfo: %s,InterfacesSnmp:%s, Neighbour:%s,NextHops:%s })''' % ([ str ( dev[ 'system' ] ) ],
                                                                                                  [ str ( dev[ 'interfaces' ] ) ],
                                                                                                  [ str ( dev['neighbours' ] ) ],
                                                                                                  [ str ( dev['nextRoute' ] ) ])
                                                                                                  [str(dev[ 'nextRoute' ])])
    return query


def query_scan_snmp(dev1,dev2):
    query = '''MERGE (d:node { Hostinfo: %s, InterfacesScan:%s, Services: %s, Vuls: %s, SystemInfo: %s, InterfacesSnmp:%s,
               Neighbour:%s, NextHops:%s })''' % ([ str ( dev1[ 'host' ] ) ],[ str ( dev1[ 'interface' ] ) ],[ str ( dev1[ 'services' ] ) ],
                                 [ str ( dev1[ 'vuls' ] ) ],[ str ( dev2[ 'system' ] ) ],[ str ( dev2[ 'interfaces' ] ) ],
                                 [ str ( dev2[ 'neighbours' ] ) ],[ str ( dev2['nextRoute' ] ) ])
    return query


def insert_dev_to_db(cred,devices,snmp_info,scan_info):

    for dev in devices:
        snmp_dev = verify_snmp ( dev,snmp_info )
        scan_dev = verify_scan ( dev,scan_info )
        if snmp_dev[ 0 ] and scan_info[ 0 ]:
            insert_to_db ( cred,query_scan_snmp( scan_dev[ 1 ],snmp_dev[ 1 ] ) )
        if snmp_dev[ 0 ] and not scan_dev[ 0 ]:
            insert_to_db ( cred,query_snmp ( snmp_dev[ 1 ] ) )
        if not snmp_dev[ 0 ] and scan_dev[ 0 ]:
            insert_to_db ( cred,query_scan( scan_dev[ 1 ] ) )
        if not snmp_dev[ 0 ] and not scan_dev[ 0 ]:
            query = '''MERGE (d:dev {address: %s,mac: %s})'''%([str(dev[0])],[str(dev[1])])
            insert_to_db ( cred,query )

    return 0


def match_from_neo4j(cred,query):
    driver = GraphDatabase.driver ( cred[ 0 ],auth=basic_auth ( cred[ 2 ],cred[ 1 ] ) )
    session = driver.session ( )
    # session.run ( insert_query[ 0 ],parameters={"host": insert_query[ 1 ]} )
    result = session.run ( query )
    session.close ( )

    return result


def get_source_node(cred,src):
    query = '''MATCH (n:node)
               WHERE n.InterfacesSnmp IS NOT NULL
               RETURN ID(n),n.InterfacesSnmp;
            '''
    result = match_from_neo4j(cred,query)
    return get_id(result,src)

def get_id(result,node):
    for record in result:
        interfaces = ast.literal_eval(record["n.InterfacesSnmp"][0])
        if node['interfaces'] == interfaces:
            return record['ID(n)']
    return None


def get_node_id(cred,node):
    query = '''MATCH (n:node)
               WHERE n.mac IS NOT NULL AND n.address IS NOT NULL
               RETURN ID(n),n.mac,n.address;
            '''
    result = match_from_neo4j ( cred,query )
    for record in result :
        if record['n.address'] == node[0] and record['n.mac']== node[1]:
            return record['ID(n)']
    return 0


def get_target_node(cred,dest):
    target = verfiy_target(cred,dest)
    # print target1
    if target[0]:
        return target[1]
    else:
        return get_node_id(cred,dest)
        # for record in target2:
        #     targetID = record['ID(n)']
            # print targetID
    return None


def verfiy_target(cred,dest):
    query1 = '''MATCH (n:node)
                    RETURN ID(n),n.InterfacesScan ;
                '''
    result = match_from_neo4j ( cred,query1 )
    for record in result:
        if record[ "n.InterfacesScan" ] != None:
            v = ast.literal_eval ( record[ "n.InterfacesScan" ][ 0 ] )
            if v['mac'] ==dest[1] and v['address'] == dest[0]:
                return [True,record['ID(n)']]

    return [False,None]


def insert_rel_type_0(cred,src,if_src,dest):

    sourceNodeID = get_source_node(cred,src)
    targetNodeID = get_target_node(cred,dest)
    # print sourceNodeID
    # print targetNodeID
    query = '''MATCH (d1:node),(d2:node)
               WHERE ID(d1) = %s AND ID(d2)=%s
               MERGE (d1)<-[l:CONNECT {interface_0:%s}]->(d2);
            '''%(sourceNodeID,targetNodeID,[ str ( if_src ) ])
    insert_to_db(cred,query)
    return 0


def insert_rel_type_1(cred,src,if_src,dest,if_dest):
    query = ''' MATCH (d:node)
                WHERE d.InterfacesSnmp IS NOT NULL
                RETURN ID(d),d.InterfacesSnmp;
            '''
    src_id = get_id(match_from_neo4j(cred,query),src)
    dest_id = get_id(match_from_neo4j(cred,query),dest)

    query_insert = '''MATCH (d1:node),(d2:node)
                      WHERE ID(d1) = %s AND ID(d2)=%s
                      MERGE (d1)<-[l:CONNECT {interface_0:%s}]->(d2);
                   ''' % (src_id,dest_id,[ str ( if_src ) ],[ str ( if_dest ) ])
    insert_to_db ( cred,query )
    # query = ''' MATCH (d1:node),(d2:node)
    #             WHERE d1.InterfacesSnmp = %s AND d2.InterfacesSnmp = %s
    #             MERGE (d1)<-[l:CONNECTED {interface_0:%s,interface_1:%s}]->(d2);
    #         ''' %([ str ( src[ 'interfaces' ] ) ],[ str ( dest[ 'interfaces' ] ) ],[ str ( if_src ) ],[ str ( if_dest ) ])
    # match_from_neo4j(cred,query)
    return 0


def store_connectivity(cred,src,if_src,dest,if_dest):

    if if_dest == None:
        insert_rel_type_0(cred,src,if_src,dest)
    else:
        insert_rel_type_1(cred,src,if_src,dest,if_dest)

    return 0
