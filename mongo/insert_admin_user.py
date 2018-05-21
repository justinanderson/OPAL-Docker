import sys
import datetime
from pymongo import MongoClient

#####################################
# main program                      #
#####################################

mongoURL = sys.argv[1]
adminPwd = sys.argv[2]

client = MongoClient('mongodb://' + mongoURL + '/')

adminUser = {"type": "ADMIN",
              "defaultAccessLevel": "antenna",
              "authorizedAlgorithms": {
                  "density": "antenna"
              },
              "username": "admin",
              "token": "qwerty1234",
              "created": datetime.datetime.utcnow()
             }

client.opal.eae_users.insert_one(adminUser)

client.close()
