---
layout: whitepaper
title:  Planetoids
tagline: Storage Sidechain for Dapps
date:   2017-02-21 12:52:47 -0500
live:   true
---
A planetoid is a [document](#document) storage sidechain designed for one-way operability with an [evm](#evm) blockchain. Data can move from an [evm](#evm) to a planetoid, but not vice-versa.

Planetoids attempts to take the best properties of a public blockchain (censorship resistance, economic finality, spam prevention, provable timestamps) while reducing [evm](#evm) storage to a mere 32-bytes (excluding contract bytecode). Planetoids work by continually overwriting the existing [root record hash](#root-record-hash), and therefore do not grow [evm](#evm) storage usage no matter how many [documents](#document) are added.

![Planetoid Contract](/img/planetoids/evm.png)

Planetoids are fundamentally secured by their parent [evm](#evm). They do not need any additional consensus or security considerations. However, at least one node must exists which watches the [planetoid contract](#planetoid-contract) for new [document add transactions](#document-add-transaction) and makes the [document](#document) available in the [planetoid resolver](#planetoid-resolver).

Good candidates for planetoid storage include

1. Encrypted messages
2. User interface data
3. Notarized data

Under this vision, each [dapp](#dapp) will have their own planetoid with custom [access/spam rules](#access-rules) that make sense for their own [dapp](#dapp). It is particularly useful for privacy conscious [dapps](#dapp) where the process of requesting [documents](#document) could leak sensitive information like IP addresses.

### Deploying a Planetoid
To deploy a planetoid, a [dapp](#dapp) creator must deploy a [planetoid contract](#planetoid-contract) and a [planteoid resolver](#planetoid-resolver). Planetoid contracts are well defined (see the [Planetoid Contract API](#planetoid-contract-api)) while planetoid resolvers are left agnostic.

### Syncing from a Planetoid
To sync with a planetoid...

1. A [client](#client) checks the [planetoid contract](#planetoid-contract) for the [root record hash](#root-record-hash).
2. The client then requests the associated [record](#record) from the [planetoid resolver](#planetoid-resolver).
3. The [record](#record) is [unmarshalled](#unmarshalled--marshalled) to reveal a [document hash](#document-hash) and [previous record hash](#previous-record-hash).
4. The client use the [document hash](#document-hash) and [previous record hash](#previous-record-hash) to get, respectively, the [document](#document) and previous [record](#record) from the [planetoid resolver](#planetoid-resolver).
5. Steps 2-4 are repeated until the client receives a [record](#record) who's [previous record hash](#previous-record-hash) is the [genesis record hash](#genesis-record-hash).

![Planetoid](/img/planetoids/planetoid.png)

### Record Format

A record consists of 96 bytes (3 [evm](#evm) words) of tightly packed data.

| Bytes    | Field                | Description  |
|----------|----------------------|--------------|
| `4`      | `timestamp`          | The block timestamp of the [document add transaction](#document-add-transaction)|
| `20`     | `sender`             | The [evm](#evm) caller of the [document add transaction](#document-add-transaction)         |
| `4`      | `gigawei`            | The gigawei value of the [document add transaction](#document-add-transaction)  |
| `4`      | `documentLength`     | The number of bytes in the [document](#document)                                |
| `32`     | `documentHash`       | The [evm](#evm) sha3 hash of the [document](#document)                          |
| `32`     | `previousRecordHash` | The [root record hash](#root record hash) before the [document add transaction](#document-add-transaction)|

<br>
### Planetoid Contract API

#### Adding a document
    addDocument(bytes document) returns (bytes32 recordHash)

#### Getting the current root record hash
    rootRecordHash() returns (bytes32 rootRecordHash)

<br>
### Planetoid Resolver Agnosticism

Planetoid resolvers are left agnostic in this whitepaper. It is possible to build an infinite number of systems with various design tradeoffs. All that matters is that a planetoid resolver exist which:

1. Takes a [document hash](#document-hash) and returns a [document](#document)
2. Takes a [record hash](#record-hash) and returns a [record](#record)
3. Watches a [planetoid contract](#planetoid-contract) for new [document add transactions](#document-add-transaction)

Examples of possible planetoid resolvers, and their tradeoffs, include

1. A web server which communicates over HTTP (centralized, but efficient)
2. A [smart contract](#smart-contract) (expensive, but simple)
3. A kademlia dht over devp2p/libp2p (complicated, but cheap)

### Document Size Limitations
Since the [record](#record) includes 4 bytes to report the [document's](#document) length, documents can be no larger than 2^32-1 bytes. Practically speaking, the size of a [document](#document) will be limited by the transaction limit of the [evm](#evm). Dapp owners can limit the size, or change the incentive structure of adding new documents by changing the [access rules](#access-rules).

## Glossary

#### access rules
Logic on a [planetoid contract](#planetoid-contract) that determines who can make new [document add transactions](#document-add-transaction)

#### unmarshalled / marshalled
The process of converting data to and from its compact blob form

#### document add transaction
The [evm](#evm) call to a [planetoid contract](#planetoid-contract) which adds a new [document](#document) to the planetoid.

#### previous record hash
The [record hash](#record-hash) of the record added most directly before the current record. The chaining of previous record hashes forms a linked list from the [root record hash](#root-record-hash) to the [genesis record](#genesis-record-hash)

#### genesis record hash
A null [record hash](#record-hash) the signifies the planetoid has reached its end.

#### root record hash
The most recent [record hash](#record-hash), as reported by the [planetoid contract](#planetoid-contract).

#### record
A document header that contains meta-data about a document as well as the [previous record hash](#previous-record-hash).

#### document
An arbitrary blob of data who's contents must be accessed for the functioning of a dapp, but are necessary for the functioning of a smart contract.

#### dapp
A decentralized application

#### client
Software for accessing a [dapp](#dapp)

#### evm
Ethereum Virtual Machine

#### document hash
The [evm](#evm) sha3 hash of a [document](#document)

#### record hash
The [evm](#evm) sha3 hash of a [record](#record)

#### smart contract
A program deployed on an [evm](#evm) network

#### planetoid contract
A [smart contract](#smart-contract) that accepts documents and returns [record hashes](#record-hash).

#### planetoid resolver
A resolver that accepts [document hashes](#document-hash)/[record hashes](#record-hash) and returns [documents](#document)/[records](#record).

#### exchange rate buffer
An extra amount of [wei](#wei) added to an order to protect the merchant against exchange rate volatility.
