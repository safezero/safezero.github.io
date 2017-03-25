---
layout: whitepaper
title:  SafeMarket
tagline: A Peer-to-Peer Marketplace
date:   2017-02-21 12:52:47 -0500
live:   true
---

SafeMarket is a peer-to-peer marketplace which can be deployed on any [evm](#evm) compatible blockchain. It is primarily concerned with protection against financial data leaks and exchange rate volatility.

While SafeMarket uses a [planetoid](#planetoid) for storage, it is not necessary to fully understand how it works. If you'd like to learn more, you can read the [Planetoids Whitepaper](/posts/planetoids).

## Personas

We identify 4 personas who are interested in using or interacting with SafeMarket.

1. A [buyer](#buyer): A human or [smart contract](#smart-contract) who wants to buy something on SafeMarket
2. A [merchant](#merchant): A human or [smart contract](#smart-contract) who wants to sell something on SafeMarket
3. An [affiliate](#affiliate): A human that drives traffic to a [store page](#store-page)
4. A [currency price setter](#currency-price-setter): A human or [smart contract](#smart-contract) that reports the price of a currency as a trusted oracle

## Currencies

### Currency Codes
A [currency code](#currency-code) is a 4-byte identifier of a currency. In order to allow for efficient and accurate currency calculations on the [evm](#evm), currencies are typically expressed in in scientific notation. For example, [currency code](#currency-code) `USD6` refers to 10e-6 USD (or 1 / 1000000th of a dollar). A product costing 2 EUR could be stated as costing 2000000 `EUR6`. The [currency code](#currency-code) `WEI0` refers to a single unit of [wei](#wei).

### Currency Price Ids
Since any human or [smart contract](#smart-contract) can be a [currency price setter](#currency-price-setter), it is important to be able to uniquely track a specific [currency code](#currency-code) as reported by a specific [currency price setter](#currency-price-setter). Thus we introduce a [currency price id](#currency-price-id) consisting of an [evm](#evm) sha3 hash of a [currency price setter](#currency-price-setter) and [currency code](#currency-code).

    currency_price_id = sha3(msg.sender, currency_code)

While all payments on SafeMarket are made using [wei](#wei), stores report their prices in terms of a [currency price id](#currency-price-id). This allows the [client](#client) to accurately report prices, and for [exchange rate buffer](#exchange-rate-buffer) to be effectively mediated.

## Stores

### Creation
In order to create a store a [merchant](#merchant):

1. Generates a [store keypair](#store-keypair)
2. Chooses a 32-byte [code point restricted](#code-point-restricted) [alias](#alias) that has not been previously registered on the [evm](#evm).
3. The merchant constructs the [store meta](#store-meta) and [marshalls](#marshall--unmarshall) it into a blob
4. The [marshalled](#marshal--unmarshal) [store meta](#store-meta) is added to the [store registry](#store-registry)

The [store registry](#store-registry) does not internally store the [store meta](#store-registry). Rather, the [store registry](#store-registry) forward the [store meta](#store-meta) to the [planetoid contract](#planetoid-contract), storing only the [store meta hash](#store-meta-hash).

### Access
In order for a [client](#client) to access a [store](#store-meta) they must:

1. Use the [store registry](#store-registry) to determine the [store meta hash](#store-meta-hash) registered to a desired [alias](#alias)
2. Use the [planetoid resolver](#planetoid-resolver) to get the [store meta](#store-meta)
3. [Unmarshal](#marshal--unmarshall) the [store meta](#store-meta) and construct a [store page](#store-page) to present to the [buyer](#buyer)

## Orders

### Creation
To create an [order](#order) for a [buyer](#buyer), a [client](#client):
1. Generates a [positive-restricted](#positive-restricted) [buyer keypair](#buyer-keypair).
2. Using the [store public key](#store-public-key) listed in the [store meta](#store-meta), the [client](#client) performs [bilateral key derivation](#bilateral-key-derivation) to derive an [order key](#order-key)
3. The [order key](#order-key) is [hashed](#hash) to derive an [order id](#order-id).
4. The [order key](#order-key) is used as a [link key](#link-key) with the [store public key](#store-public-key) in [linked address derivation](#linked-address-derivation). The resulting address is designated as the [store linked address](#store-linked-address).
5. (optional) If an [affiliate](#affiliate) sent the [buyer](#buyer) to the [store page](#store-page), the [client](#client) uses the [buyer keypair](#buyer-keypair) and the [affiliate public key](#affiliate-public-key) to derive an [affiliate key](#affiliate-key) via [bilateral key derivation](#bilateral-key-derivation).
6. The [buyer](#buyer) constructs an [order meta](#order-meta) containing their order details (such as product ids, shipping id, and quantities).
7. The [order meta](#order-meta) is [marshalled](#marshal--unmarshal) into a blob.
8. The [marshalled](#marshal--unmarshal) [order meta](#order-meta) is [encrypted](#encryption) with the [order key](#order-key).
9. The resulting [ciphertext](#ciphertext) is [encapsulated](#encapsulation)    
10. A transaction is made to the [order registry](#order-registry) including
    1. As data:
        1. The [order id](#order-id)
        2. The [buyer's](#buyer) [stripped public key](#stripped-public-key)
        3. The [store linked address](#store-linked-address)
        4. The [affiliate linked address](#affiliate-linked-address), or [null address](#null-address) if no affiliate is included
        5. The [currency price id](#currency-price-id) of the [store](#store)
        6. The [prebuffer total](#prebuffer-total) of the order expressed in terms of the [currency price id](#currency-price-id)
        7. The [wei](#wei) amount of [store prefund](#store-prefund) included in step 10.2.3.
    2. As the value, the sum of:
        1. The [wei](#wei) value of the [prebuffer total](#prebuffer-total)
        2. The [wei](#wei) value of the [exchange rate buffer](#exchange-rate-buffer)
        3. A [store prefund](#store-prefund)

### Notification

Since order's are created using a [store linked address](#store-linked-address) and an [affiliate linked address](#affiliate-linked-address), only the [buyer](#buyer) knows the [store](#store) and [affiliate](#affiliate) of an [order](#order). Store's and affiliates must watch the [order registry](#order-registry) for every new [order](#order). For every [order](#order), they:

1. Unstrip the buyer's [stripped public key](#stripped-public-key), and use [bilateral key derivation](#bilateral-key-derivation) to obtain a [link key](#link-key).
    1. If the interested individual is a [merchant](#merchant):
        1. Assume the [link key](#link-key) is a candidate [order key](#order-key)
        2. Hash the [order key](#order-key) to obtain a candidate [order id](#order-id)
        3. Compare the candidate [order id](#order-id) to the [order id](#order-id) of the [order](#order). If they match, they are the store included in the [order](#order)
    2. If the interested individual is a [affiliate](#affiliate):
        1. Assume the [link key](#link-key) is a candidate [affiliate key](#affiliate-key)
        2. Derive a candidate [affiliate linked address](#affiliate-linked-address) using [linked address derivation](#linked-address-derivation)
        3. Compare the candidate [affiliate linked address](#affiliate-linked-address) to the [affiliate linked address](#affiliate-linked-address) included in the [order](#order). If they match, they are the [affiliate](#affiliate) included in the [order](#order)

### Interaction
There are four ways to interact with an order:
1. Cancel
2. Mark as shipped
3. Withdraw
4. Add message

#### Cancel
Either a [buyer](#buyer) or [merchant](#merchant) (broadcasting a transaction from a [store linked address](#store-linked-address)) can cancel an [order](#order). Upon cancellation, the entirety of the [wei](#wei) of an order is sent to the [buyer](#buyer).

#### Mark As Shipped
A [merchant](#merchant) (broadcasting a transaction from a [store linked address](#store-linked-address)) can mark an order as shipped. Upon marking an order as shipped:
1. The [order registry](#order-registry) checks the current price of [currency price id](#currency-price-id) included in the [order](#order).
2. The [prebuffer total](#prebuffer-total) is multiplied by the current price to calculate the [store payout](#store-payout)
3. If the [store payout](#store-payout) is less than the [wei](#wei) value of the order, the excess [wei](#wei) is refunded to the buyer

#### Withdraw
After an order has been marked as shipped, the [wei](#wei) value of the [order](#order) will still be in the [order registry](#order-registry). In order to withdraw the remaining [wei](#wei), the [merchant](#merchant) (broadcasting a transaction from a [store linked address](#store-linked-address)) must send a withdraw transaction including a [payout address](#payout-address). Although any [payout address](#payout-address) can be given, it is suggested that a unique [payout address](#payout-address) be used for each [order](#order) so that [order](#order) cannot be linked through blockchain-analysis. This is enforced at the [client](#client) level instead of the [order registry](#order-registry).

####  Add a Message
To add a message, either a [buyer](#buyer) or [merchant](#merchant) (broadcasting a transaction from a [store linked address](#store-linked-address)):
  1. [Encrypts](#encryption) a plaintext with the [order key](#order-key)
  2. [Encapsulates](#encapsulation) the [ciphertext](#ciphertext)
  3. Broadcasts a transaction to the [order registry](#order-registry)

The order registry does not directly store the [encapsulated](#encapsulated) message. Rather it passes them along to the [planetoid contract](#planetoid-contract) and stores the [record hash](#record-hash).

However, prior to sending a message to the [planetoid contract](#planetoid-contract), the [encapsulated](#encapsulated) message is prepended with the sender's address to form a [sender prefixed encapsulated message](#spem). Prepending the sender is important since from the point-of-view of the [planetoid contract](#planetoid-contract) the [order registry](order-registry) is the sender included in the [record](#record). In order to retrieve the actual message sender (either the [buyer](#buyer) or the [store linked address](#store-linked-address)) , must be included in the [document](#document).

## Glossary

#### client
Software that allows humans to access SafeMarket data or creating new SafeMarket orders

#### affiliate
A human that drives traffic to a SafeMarket store

#### currency price setter
A human or [smart contract](#smart-contract) that reports the price of a [currency code](#currency-code) as a trusted oracle

#### currency code
A 4-byte identifier of a currency such as `USD6` or `WEI0`.

#### currency price id

A unique 32-byte identifier for tracking the price of a [currency code](#currency-code) as reported by a [currency price setter](#currency-price-setter)

#### wei
The smallest unit of native-token account on an [evm](#evm) blockchain.

#### evm
Ethereum Virtual Machine

#### smart contract
An autonomous program deployed on the [evm](#evm).

#### marshal / unmarshal
The act of turning a structured dictionary of data into a blob and vice versa.

#### smart contract
A program deployed on an [evm](#evm) network

#### spem
Sender prefixed encapsulated message. An encapsulated message, which has the address of the message sender prepended.

#### payout address
An address chosen by a merchant to withdraw funds to after an order has been shipped. This could be a wallet address or input address at an exchange.

#### affiliate

A third party who pushes buyers to a store page, or creates orders on SafeMarket. An affiliate could be a search engine, blogger, or independent [client](#client) developer.

#### affiliate fee

A fixed percentage of a [prebuffer total](#prebuffer-total) that is sent to an [affiliate linked address](#affiliate-linked-address) upon order an order being [marked as shipped](#marked-as-shipped). The affiliate-fee is incentive for [affiliates] to drive traffic to SafeMarket [store pages](#store-pages) and build new [clients](#clients).

#### gas

The [wei](#wei) paid to miners for including transactions in the [evm](#evm) blockchain.

#### optionally rounded

Describes a payment amount optionally rounded up value in order to prevent statistical analysis linking orders to stores.

#### store prefund

A small amount of [wei](#wei) (~10gwei) sent to a [store linked address](#store-linked-address) upon order creation so that merchants can pay the necessary gas for new transactions.

#### exchange rate buffer
Collateral put up by a [buyer](#buyer) to protect a [store](#store) from exchange rate volatility.

#### prebuffer total
The total amount of an order (products and shipping) before an [exchange rate buffer](#exchange-rate-buffer) is applied.

#### postbuffer total
The total amount of an order (products and shipping) after an [exchange rate buffer](#exchange-rate-buffer) is applied.

#### null-address
[Evm](#evm) address 0x0000000000000000000000000000000000000000.

#### encryption
A application of aes-128-cbc with a randomly generated 128-bit IV using PKCS#5 padding.

#### encapsulation
Prepending the 128-bit iv used for [encryption](#encryption) to the [ciphertext](#ciphertext).

#### ciphertext
The padded blob result of [encryption](#encryption)

#### bilateral key derivation
Deriving a shared secret between two [keypairs](#keypair) using Diffe-Hellman, and [hashing](#hash) the resulting shared secret.

#### keypair
A private and public key on the elliptic curve secp256k1

#### hash
An application of the keccak256 hash function as described in the Ethereum Yellow Paper.

#### order id
A unique identifier of an [order](#order) on the [order registry](#order-registry).

#### store
A collection of data (alias, merchant, store-meta) registered on the [store registry](#store-registry). Stores are **not** [smart contracts](#smart-contract).

#### store page
A [buyer](#buyer)-viewable interface for a [store](#store) that lists it's products, shipping, etc.

#### merchant
The human or [smart contract](#smart-contract) owner of a [store](#store).

#### buyer
A human or [smart contract](#smart-contract) who wishes to buy something from a [store](#store).

#### store keypair

The [keypair](#keypair) used for deriving [order keys](#order-key) and [store linked keypairs](#store-linked-keypair).

#### holder
Describes a human that has access to the private key of a [keypair](#keypair)

#### store linked keypair
A [keypair](#keypair) that can be derived by any [holder](#holder) of a given [store keypair](#store-keypair).

#### store linked address
The [evm](#evm) address derived from a [store linked keypair](#store-linked-keypair). Both the merchant and the buyer can derive the store linked address, but nobody else.

#### affiliate linked address
The [evm](#evm) address derived from a [affiliate linked keypair](#store-linked-keypair). Both the [affiliate](#affiliate) and the [buyer](#buyer) can derive the store linked address, but nobody else.

#### buyer keypair
An ephemeral [keypair](#keypair) generated by a [buyer's](#buyers) [client](#client) for a single [order](#order). Used for the derivation of [order keys](#order-key) and [affiliate keys](#affiliate-key)

#### store public key
The public part of a [store keypair](#store-keypair) listed in the [store meta](#store-meta).

#### order key
A shared secret between a [buyer](#buyer) and [store keypair](#store-keypair) [holder](#holder) used for [message](#message) [encryption](#encryption) and [bilateral key derivation](#bilateral-key-derivation) of [linked store addresses](#linked-store-address).

#### store registry
A [smart contract](#smart-contract) that manages the creation, updates, and transfers, of [stores](#store) on SafeMarket.

#### order registry
A [smart contract](#smart-contract) that manages the creation and updates of [orders](#orders) on SafeMarket.

#### order
An request by a [buyer](#buyer) for a set of products and shipping for a given [currency price id](#currency-price-id) and value.

#### positive-restricted

Describes a [keypair](#keypair) where the y-coordinate of the public key is positive. This can be enforced by ensuring that the first byte of the SEC1 compressed public key is `0x03`.

#### stripped public key

The right 32 bytes of a [positive-restricted](#positive-restricted) [keypair's](#keypair) public key. Stripping a public key allows a public key, which is typically 33-bytes, to be stored within a 32-byte [evm](#evm) word.

#### code point restricted
Describes a blob where every byte belongs to ascii code-points [`a-z`, `1-9`, `_`]. 0-bytes are allowed only as right-padding. Code-point restriction is intended to prevent phishing attacks where similar looking characters, or null-characters, are used to confuse users.

#### alias
A human-friendly ascii sequence used for identifying [stores](#stores) on SafeMarket.

#### store meta
A dictionary of store data such as (but not limited to) products and shipping options. Store meta is [marshalled](#marshal--unmarshal) into a blob using the Safemarket Protofile.

#### order meta
A dictionary of order data such as (but not limited to) products and shipping. Order meta is [marshalled](#marshal--unmarshal) into a blob using the Safemarket Protofile.

#### store meta hash
A [planetoid](#planetoid) record hash for which the resolved document is a [store meta](#store-meta)

#### planetoid
A dapp-specific storage sidechain. For more information please read the [Planetoids whitepaper](/posts/planetoids)

#### planetoid contract
A [smart contract](#smart-contract) which saves blobs (referred to as documents) in a [planetoid](#planetoid) and returns a hash which can be used to obtain the original document through the [planeoid resolver](#planetoid-resolver).

#### planetoid resolver
A resolver which can be given a hash and return a [documents](#document) from a [planetoid](#planetoid).

#### link key
A blinding factor used in [linked address derivation](#linked-address-derivation) and [linked key derivation](#linked-address-derivation)

#### linked address derivation
A method for deriving an [evm](#evm) address from a public key and [link key](#link-key). Given a public key, and a [link key](#link-key), multiply the generator point (G) of the secp256k1 curve by the [link key](#link-key), and add the public key point. Convert the resultant public key into an [evm](#evm) address.

#### linked keypair derivation
Given a private key, and a [link key](#link-key), add the link key to the private key and modulo over the order (n) of the secp256k1 curve. The result is used as a private key for a [keypair](#keypair).

#### affiliate public key
The public key part of a [keypair](#keypair) for which the affiliate is a [holder](#holder)

#### affiliate key
A shared secret between a [buyer](#buyer) and an [affiliate](#affiliate) derived via [bilateral key derivation](#bilateral-key-derivation)

#### store payout
The amount of value paid to a store after an [order](#order) has been marked as shipped.

#### record hash
A [hash](#hash) that can be used to fetch a [document](#document) on a [planetoid](#planetoid)

#### document
A arbitrary blob stored on a [planetoid](#planetoid)
