"""
FlashAssassin debug server
==========================

This little Flask app provides a suitable implementation of the FlashAir API.
It can be used to debug the FlashAssassin server.

A demo picture has been added to DCIM directory already that can be used to
test the app.
"""


import os
from flask import Flask, request, send_file
from werkzeug.exceptions import BadRequest, NotFound, Forbidden

app = Flask(__name__, static_folder=".")


@app.route("/")
@app.route("/<path:path>")
def static_files(path=None):
    """
    Serves static files in the Flask app directory.
    """

    if path is None:
        raise NotFound()

    full_path = os.path.abspath(os.path.join(os.curdir, path.lstrip("/")))

    if not os.path.isfile(full_path):
        raise BadRequest()

    rel_path = os.path.relpath(full_path, app.root_path)

    if rel_path.startswith("."):
        raise BadRequest()

    return send_file(rel_path)


@app.route("/command.cgi")
def command_cgi():
    """
    Implementation of the FlashAir API endpoint that are relevant for
    debugging the client application.

    FlashAir API documentation:
    https://www.flashair-developers.com/en/documents/api/commandcgi/

    Implemented operations:
      - Get file list (op=100)
      - Get update status (op=102)
    """

    op = int(request.args["op"])

    # send responses as plain text
    headers = {"Content-Type": "text/plain"}

    if op == 100:
        reply = []

        path = request.args["DIR"]

        full_path = os.path.abspath(os.path.join(os.curdir, path.lstrip("/")))

        if not os.path.exists(full_path):
            raise NotFound()

        def is_forbidden(path):
            return any((part.startswith(".") for part in path.split("/"))) or \
                any(("SD_WLAN" in p for p in path.split("/")))

        if is_forbidden(path):
            raise Forbidden()

        for i in os.listdir(full_path):
            if path != "/" or os.path.isdir(i) and not is_forbidden(i):
                flags = 0

                filename = os.path.basename(i)

                stat = os.stat(os.path.join(full_path, i))

                if stat.st_mode & 0o040000:
                    # is directory
                    size = 0
                    flags += 1<<4

                    # treated as "archive"
                    if filename == "DCIM":
                        flags += 1<<5

                else:
                    size = stat.st_size
                    flags += 1<<5

                row = [
                    path if path != "/" else "",
                    filename,
                    size,
                    flags,
                    18787,
                    44686
                ]

                reply.append(",".join((str(i) for i in row)))

        # sort the result
        reply.sort(key=lambda x: x[1])

        # this line is (whyever) inserted by the original API
        reply.insert(0, "WLANSD_FILELIST")

        return app.response_class("\n".join(reply), headers=headers)

    if op == 102:
        # always returns 1 to indicate an update event
        return app.response_class("1\n", headers=headers)


# run debug server in PyCharm compatible mode (aka disabled reloader)
app.run(debug=True, use_reloader=False)
