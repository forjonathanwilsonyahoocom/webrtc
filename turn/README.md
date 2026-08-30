enter the coturn container

```bash
 docker exec -it  webrtc-coturn-1 bash
```
then use the turnadmin tool to create users, the -b location will be created

```bash
turnadmin -a -u alice -p p4ssw0rd -r example.com -b <name of the file you want to have be the db>
```

then i've been pulling it out of the container and re-mounting it, but you do you
