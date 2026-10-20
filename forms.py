from flask_wtf import FlaskForm 
from wtforms import SubmitField, StringField, PasswordField,RadioField
from wtforms.validators import InputRequired, EqualTo

class RegistrationForm(FlaskForm):
    user_id = StringField("User id:", validators=[InputRequired()])
    password = PasswordField("Password:", validators=[InputRequired()])
    password2 = PasswordField("Confirm Password:", validators=[InputRequired(), EqualTo("password")])
    submit = SubmitField("Submit")

class LoginForm(FlaskForm):
    user_id = StringField("User id:", validators=[InputRequired()])
    password = PasswordField("Password:", validators=[InputRequired()])
    submit = SubmitField("Submit")

class difficultyForm(FlaskForm):
    difficulty = RadioField("What difficulty leaderboard do you want to see?",
        choices = ["easy","medium","hard"],
        default = "medium",
        validators = [InputRequired()])
    submit = SubmitField("Submit")