## OntFS-JS-SDK

> fs js sdk in node env.



### Dependency

* node.js >= 10
* npm >= 6.9.0
* yarn >= 1.15.2

### Install


```shell
$ cd ontfs-js-sdk
$ yarn install (or npm install)
```



#### Built and run with Dockerfile

```shell
$ docker built -t ontfsclient:0.0.1 .
$ docker run -it ontfsclient:0.0.1 bash
```



#### Examples



##### Upload files

```shell
$ cd ./examples/upload-file
$ node index.js --filePath=./test.dat --name=test -copyNum=1 --timeExpired="2020-04-25 00:00:00" --firstPdp=true --storeType=1 --pdpInterval=600
```



##### Download file

```shell
$ cd ./examples/download-file
$ node index.js --fileHash=bafkreih7wrw5icnbfq2cxl2jcpplgdwgxyxte4hnreg2i5qcxnzyr6xlma --outFilePath=./Downloads/test.dat
```

