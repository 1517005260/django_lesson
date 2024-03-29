from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User  #创建用户需要基础的USER和我们新建的Player
from game.models.player.player import Player

class PlayerView(APIView):
    def post(self,request):
        data = request.POST
        username = data.get("username","").strip()  #strip将用户名的前后空格去掉，中间不去
        #如果有就返回用户名，没有就空
        password = data.get("password","").strip()
        password_confirm = data.get("password_confirm","").strip()

        if not username or not password:
            return Response({'result':"用户名和密码不能为空"})
        if password != password_confirm:
            return Response({'result':"前后密码不一致"})
        if User.objects.filter(username = username).exists():  #filter查找数据库
            return Response({'result':"用户名已存在"})
    
        user = User(username = username)
        user.set_password(password)  #存密码hash值
        user.save()  #user创建完毕
        Player.objects.create(user = user , photo = "https://app6534.acapp.acwing.com.cn/static/image/menu/icon.jpg") 
        #player创建完毕，用的默认头像
        return Response({'result':"success"})