import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
from dotenv import load_dotenv, find_dotenv
from flask import Flask, request, render_template, redirect, url_for
import os
from datetime import datetime
from dateutil import tz
import sys

################
# Utilities
################
def getHoustonTime():
	fromZone = tz.gettz('UTC')
	toZone = tz.gettz('America/Chicago')
	utc = datetime.utcnow().replace(tzinfo=fromZone)
	return utc.astimezone(toZone)

def isOpen():
	houstonNow = getHoustonTime()
	# Hoot is open 8pm - 1:45am on Thursday, 8pm - 1am Sun-Wed
	if (houstonNow.weekday() == 3): # Thurs
		if (houstonNow.hour >= 20):
			return True
		elif (houstonNow.hour == 0):
			return True
		elif (houstonNow.hour == 1 and houstonNow.minute < 45):
			return True
		else:
			return False
	elif (houstonNow.weekday() in [0,1,2,6]): # MonTueWedSun
		if (houstonNow.hour >= 20):
			return True
		elif (houstonNow.hour < 1):
			return True
		else:
			return False
	else: # Closed FriSat
		return False

################
# Firebase
################

def initFirebase():
	# This is so stupid.
	# Unadultered, the private_key gets ready out with "\\\n" instead of newlines.
	# Putting the key in surrounded by quotes makes it "\n" (literal).
		# Note that the surrounding quotes are only needed on my local machine, not on heroku.
	# Read that, split, then concat actual newlines, to make it a valid private_key.

	privateKeySplit = os.environ.get("FIREBASE_ADMIN_PRIVATE_KEY").split("\\n")
	privateKey = ""
	for portion in privateKeySplit:
		privateKey += portion + "\n"

	serviceAccountKey = {
		'type': os.environ.get("FIREBASE_ADMIN_TYPE"),
		'private_key': privateKey,
		'client_email': os.environ.get("FIREBASE_ADMIN_CLIENT_EMAIL"), 
		'token_uri': os.environ.get("FIREBASE_ADMIN_TOKEN_URI"),
	}

	cred = credentials.Certificate(serviceAccountKey)
	firebase_admin.initialize_app(cred, {"databaseURL": "https://hoothotline.firebaseio.com"})

# Refreshes the "Last Updated" field saved in FB
# that frontend pulls from. Is updated whenever
# updateForm is submitted.
def refreshUpdateTime():
	timeString = getHoustonTime().strftime("%I:%M %p")

	ref = db.reference("last-update")
	ref.set(timeString)

# Returns the time system as last updated, as a string
def getLastUpdateTime():
	lastUpdate = db.reference('last-update').get()
	# Strip leading zeros for aesthetics
	if (lastUpdate[0] == "0"):
		lastUpdate = lastUpdate[1:]
	
	return lastUpdate

##################
# Flask endpoints
##################

app = Flask(__name__)

@app.route('/updateForm')
def renderUpdateForm():
	foods = db.reference('inventory').get()
	specialsMessage = db.reference('specials-message').get()
	if (specialsMessage == "none"):
		specialsMessage = ""

	print("message {}".format(specialsMessage))

	return render_template('updateForm.html', foods=foods, lastUpdate=getLastUpdateTime(), specialsMessage=specialsMessage)

@app.route('/receiveUpdate', methods=['POST'])
def receiveUpdate():
	if request.method == "POST":
		outOfStock = request.form.getlist("foodItem")
		specialsMessage = request.form.get("specials-message")
		
		inventoryRef = db.reference("inventory")
		smRef = db.reference("specials-message")

		for food in inventoryRef.get().keys():
			ref = db.reference("inventory/" + food)
			if food in outOfStock:
				ref.set(False)
			else :
				ref.set(True)

		if (len(specialsMessage) > 0):
			smRef.set(specialsMessage)
		elif (len(specialsMessage) == 0):
			smRef.set("none")
		
		refreshUpdateTime()
		return redirect(url_for('renderUpdateForm'))

@app.route('/')
@app.route('/hootHotline')
def hootHotline():
	if (isOpen()):
		inventory = db.reference('inventory').get()
		specialsMessage = db.reference('specials-message').get()
		inStock = []
		outOfStock = []

		for food in inventory:
			if inventory[food]:
				inStock.append(food)
			else:
				outOfStock.append(food)

		return render_template('hootHotline.html', inStock=inStock, outOfStock=outOfStock, lastUpdate=getLastUpdateTime(), specialsMessage=specialsMessage)
	else:
		return render_template('hootClosed.html')


################
# Put it all together
################

def initEnviron():
	load_dotenv(find_dotenv())
	initFirebase()


initEnviron()
if (len(sys.argv) > 1):
	if ("-r" in sys.argv or "-run" in sys.argv):
		app.run()
