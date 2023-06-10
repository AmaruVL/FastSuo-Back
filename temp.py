import sys

strCode = sys.argv[-1].replace("redis.get(", "").split(",")

getValue = strCode[0]
value = strCode[2].split(')')[0].strip()

print(f"let {value} = getValue({getValue});")