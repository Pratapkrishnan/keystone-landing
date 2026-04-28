import shutil
import os

home = os.path.expanduser('~')
brain = os.path.join(home, '.gemini', 'antigravity', 'brain', 'da7690ee-43d6-407d-bbe0-0420fd1f091d')
src = os.path.join(brain, 'keystone_marketing_poster_1777115972297.png')
dest = 'images/marketing_poster.png'

shutil.copy(src, dest)
