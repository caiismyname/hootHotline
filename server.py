import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
from dotenv import load_dotenv, find_dotenv
from flask import Flask, request, render_template, redirect, url_for
import os


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

##################
# Flask endpoints
##################

app = Flask(__name__)

@app.route('/updateForm')
def renderUpdateForm():
	ref = db.reference("inventory")
	foods = ref.get()

	return render_template('updateForm.html', foods=foods)

@app.route('/receiveUpdate', methods=['POST'])
def receiveUpdate():
	if request.method == "POST":
		outOfStock = request.form.getlist("foodItem")
		inventoryRef = db.reference("inventory")

		for food in inventoryRef.get().keys():
			ref = db.reference("inventory/" + food)
			if food in outOfStock:
				ref.set(False)
			else :
				ref.set(True)

		return redirect(url_for('renderUpdateForm'))

@app.route('/')
@app.route('/hootHotline')
def hootHotline():
	inventory = db.reference('inventory').get()
	inStock = []
	outOfStock = []

	for food in inventory:
		if inventory[food]:
			inStock.append(food)
		else:
			outOfStock.append(food)

	return render_template('hootHotline.html', inStock=inStock, outOfStock=outOfStock)


################
# Put it all together
################

def initEnviron():
	load_dotenv(find_dotenv())
	initFirebase()


initEnviron()
app.run()
