from flask import Flask, render_template, request, g ,session, redirect, url_for
from forms import LoginForm, RegistrationForm, difficultyForm
from database import get_db, close_db
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

app = Flask(__name__)
app.config["SECRET_KEY"] = "2222"
app.teardown_appcontext(close_db)

@app.before_request
def load_logged_in_user():
    g.user = session.get("user_id", None)
def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if g.user is None:
            return redirect(url_for("login", next=request.url))
        return view(*args, **kwargs)
    return wrapped_view

@app.route("/")
@app.route("/welcome")
def index():
    return render_template("index.html")

@app.route("/Orb_Collector")
@login_required
def Orb_Collector():
    return render_template("Orb_Collector.html")


@app.route("/register", methods=["GET","POST"])
def register():
    form = RegistrationForm()
    if form.validate_on_submit():
        user_id = form.user_id.data
        password = form.password.data
        password2 = form.password2.data
        if password != password2:
            form.password.errors.append("Password is not correct")
        else:
            db = get_db()
            conflict = db.execute("""SELECT * FROM users
                                WHERE user_id = ?;""", (user_id,)).fetchone()
            if conflict is not None:
                form.user_id.errors.append("User id is already taken")
            else:
                db.execute("""INSERT INTO users(user_id,password)
                        VALUES(?,?);""",(user_id, generate_password_hash(password)) )
                db.commit()
                return redirect(url_for("login"))
    return render_template("register.html", form=form)

@app.route("/login", methods=["GET","POST"])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user_id = form.user_id.data
        password = form.password.data
        db = get_db()
        matching_user = db.execute("""SELECT * FROM users
                              WHERE user_id = ?;""", (user_id,)).fetchone()
        if matching_user is None:
            form.user_id.errors.append("Unknown user id")
        elif not check_password_hash(matching_user["password"], password):
            form.password.errors.append("Incorrect password")
        else:
            session.clear()
            session["user_id"] = user_id
            next_page = request.args.get("next")
            if not next_page:
                next_page = url_for("index")
            return redirect(next_page)
    return render_template("login.html", form=form)

@app.route("/logout")
@login_required
def logout():
    session.clear()
    return redirect(url_for("index"))

@app.route("/information")
def information():
    return render_template("information.html")

@app.route("/store_score", methods=["POST"])
@login_required
def store_score():
    user_id = g.user
    score = int(request.form["score"])
    difficulty = str(request.form["difficulty"])
    db = get_db()
    try:
        db.execute("""INSERT INTO scores (user_id, score, difficulty)
                   VALUES (?,?,?);""", (user_id, score, difficulty))
        db.commit()

    except:
        return "failure to update"
    return "success"

@app.route("/leaderboard", methods=["GET","POST"])
def leaderboard():
    db = get_db()
    form = difficultyForm()
    if form.validate_on_submit():
        rank = form.difficulty.data
        if rank == "easy":
            user_scores = db.execute("""SELECT (
                                     SELECT COUNT(DISTINCT user_id) + 1
                                     FROM scores
                                     WHERE score > s.score
                                     AND score < 150 
                                     AND difficulty = 'easy') AS rank, user_id, MAX(score) AS Score
                                    FROM scores s
                                    WHERE score IS NOT NULL
                                    AND score < 150
                                    AND difficulty = 'easy'
                                    GROUP BY user_id
                                    ORDER BY Score DESC
                                    LIMIT 10;""").fetchall()
            return render_template("leaderboard.html", form=form, user_scores = user_scores)
        elif rank == "medium":
            user_scores = db.execute("""SELECT (
                                     SELECT COUNT(DISTINCT user_id) + 1
                                     FROM scores
                                     WHERE score > s.score
                                     AND score < 150 
                                     AND difficulty = 'medium') AS rank, user_id, MAX(score) AS Score
                                    FROM scores s
                                    WHERE score IS NOT NULL
                                    AND score < 150
                                    AND difficulty = 'medium'
                                    GROUP BY user_id
                                    ORDER BY Score DESC
                                    LIMIT 10;""").fetchall()
            return render_template("leaderboard.html", form=form, user_scores = user_scores)
        elif rank == "hard":
            user_scores = db.execute("""SELECT (
                                     SELECT COUNT(DISTINCT user_id) + 1
                                     FROM scores
                                     WHERE score > s.score
                                     AND score < 150 
                                     AND difficulty = 'hard') AS rank, user_id, MAX(score) AS Score
                                    FROM scores s
                                    WHERE score IS NOT NULL
                                    AND score < 150
                                    AND difficulty = 'hard'
                                    GROUP BY user_id
                                    ORDER BY Score DESC
                                    LIMIT 10;""").fetchall()
            return render_template("leaderboard.html", form=form, user_scores = user_scores)           
    return render_template("leaderboard.html", form=form, user_scores = None)

@app.route("/finished_game")
def finished_game():
    db = get_db()
    elite_people = db.execute("""SELECT DISTINCT user_id, difficulty
                              FROM scores
                              WHERE score = 150
                              ORDER BY user_id;""").fetchall()
    return render_template("finished_game.html", elite_people = elite_people)
