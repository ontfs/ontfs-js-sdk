## OntFS-JS-SDK

> fs js sdk in node env.

### Dependency

- node.js >= 10
- npm >= 6.9.0
- yarn >= 1.15.2

### Install

```shell
$ cd ontfs-js-sdk
$ yarn install (or npm install)
```

#### Examples

##### Create wallet

```shell
$ cd ./examples/cli
$ node index.js account create --password=pwd
```

##### Upload files

```shell
$ cd ./examples/cli
$ node index.js file upload --filePath=./test.dat --desc=test -copyNum=1 --timeExpired="2020-04-25 00:00:00" --firstPdp=true --storeType=1
```

**batch upload files**

```shell
$ cd ./examples/cli
$ node index.js file upload --filePath=./test1.dat --desc="1" --firstPdp=true --timeExpired="2020-04-30 00:00:00" --copyNum=1 --storeType=1 --filePath=./test2.dat --desc="2" --firstPdp=true --timeExpired="2020-04-30 00:00:00" --copyNum=1 --storeType=1
```

##### Download file

```shell
$ cd ./examples/cli
$ node index.js file download --fileHash=bafkreih7wrw5icnbfq2cxl2jcpplgdwgxyxte4hnreg2i5qcxnzyr6xlma --outFilePath=./Downloads/test.dat
```

**batch download files**

```shell
$ cd ./examples/cli
$ node index.js file download --fileHash=bafkreih7wrw5icnbfq2cxl2jcpplgdwgxyxte4hnreg2i5qcxnzyr6xlma --outFilePath=./Downloads/test.dat --fileHash=bafkreicy6su74alclhq6fczi7ma6fysiaxq7yargmuqmyxwr2lafw3mx5y --outFilePath=./Downloads/test2.dat
```

#### build project

##### config file is webpack.config.js

```shell
$ npm run build
```

> The project code will be integrated into the directory named dist
