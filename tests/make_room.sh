JANUS=https://${ENDPOINT}/janus
SESSION_ID=$(curl -s -X POST -H "Content-Type: application/json" \
   -d '{"janus":"create",
        "transaction":"t-create"
      }' \
   $JANUS | jq -r '.data.session_id')

# 2. Attach plugin
HANDLE_ID=$(curl -s -X POST -H "Content-Type: application/json" \
   -d '{
         "janus":"attach",
	 "plugin":"janus.plugin.videoroom",
	 "transaction":"t-attach",
	 "session_id":$SESSION_ID
       }' \
   $JANUS | jq -r '.data.handle_id')

# 3. Create a test room (room id = 1234)
curl -s -X POST "$JANUS/$SESSION_ID/$HANDLE_ID" \
  -H 'Content-Type: application/json' \
  -d '{
      "janus": "create",
      "transaction": "t-create-room",
      "room": 1234,
      "description": "Audio-only test room",
      "publishers": 10,
      "is_private": false,
      "audiocodec": "opus",
      "videocodec": "none",
      "audiolevel_ext": true,
      "audiolevel_event": true
    }'

