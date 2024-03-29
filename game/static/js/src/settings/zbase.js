class Settings {
    constructor(root) {
        this.root = root;
        this.platform = "WEB"; //默认是网页端登录
        if (this.root.os)   //如果os不是默认空值，由于我们只有web和acapp两个端，所以我们要给platform赋值acapp
            this.platform = "ACAPP";

        this.username = ""; //存储用户信息
        this.photo = "";

        this.$settings = $(`
    <div class="game-settings">
        <div class="game-settings-login">
            <div class="game-settings-title">
                登录
            </div>
            <div class="game-settings-username">
                <div class="game-settings-item">
                    <input type="text" placeholder="用户名">
                </div>
            </div>
            <div class="game-settings-password">
                <div class="game-settings-item">
                    <input type="password" placeholder="密码">
                </div>
            </div>
            <div class="game-settings-submit">
                <div class="game-settings-item">
                    <button>登录</button>
                </div>
            </div>
            <div class="game-settings-error-message">
            </div>
            <div class="game-settings-option">
                注册
            </div>
            <br>
            <div class="game-settings-third-part">
                <img width="30" src="https://app165.acapp.acwing.com.cn/static/image/settings/acwing_logo.png">
                <br>
                <div>第三方一键登录</div>
            </div>
        </div>
        <div class="game-settings-register">
            <div class="game-settings-title">
                注册
            </div>
            <div class="game-settings-username">
                <div class="game-settings-item">
                    <input type="text" placeholder="用户名">
                </div>
            </div>
            <div class="game-settings-password-first">
                <div class="game-settings-item">
                    <input type="password" placeholder="密码">
                </div>
            </div>
            <div class="game-settings-password-second">
                <div class="game-settings-item">
                    <input type="password" placeholder="确认密码">
                </div>
            </div>
            <div class="game-settings-submit">
                <div class="game-settings-item">
                    <button>注册</button>
                </div>
            </div>
            <div class="game-settings-error-message">
            </div>
            <div class="game-settings-option">
                登录
            </div>
            <br>
            <div class="game-settings-third-part">
                <img width="30" src="https://app165.acapp.acwing.com.cn/static/image/settings/acwing_logo.png">
                <br>
                <div>第三方一键登录</div>
            </div>
        </div>
    </div>`);

        this.root.$game.append(this.$settings);

        //接着把定义的元素都取出来，用于交互操作
        //注意find之前的对象是父类
        this.$login = this.$settings.find(".game-settings-login");
        this.$login_username = this.$login.find(".game-settings-username input");
        this.$login_password = this.$login.find(".game-settings-password input");
        this.$login_submit = this.$login.find(".game-settings-submit button");
        this.$login_error_message = this.$login.find(".game-settings-error-message");
        this.$login_register = this.$login.find(".game-settings-option");
        this.$login.hide();  //先默认隐藏，等用户调用

        this.$register = this.$settings.find(".game-settings-register");
        this.$register_username = this.$register.find(".game-settings-username input");
        this.$register_password = this.$register.find(".game-settings-password-first input");
        this.$register_password_confirm = this.$register.find(".game-settings-password-second input");
        this.$register_submit = this.$register.find(".game-settings-submit button");
        this.$register_error_message = this.$register.find(".game-settings-error-message");
        this.$register_login = this.$register.find(".game-settings-option");
        this.$register.hide();

        this.$third_part_login = this.$settings.find(".game-settings-third-part img");

        this.start();
    }

    start() {
        if (this.platform === "ACAPP") {
            //acapp端
            this.getinfo_acapp();
        } else {
            if (this.root.access) {
                this.getinfo_web();
                this.refresh_jwt();  //登录后开始刷新access
            } else {
                this.login();   //没有access则手动登录
            }
            this.events();  //绑定监听函数
        }
    }

    refresh_jwt() {
        let outer = this;
        setInterval(function () {
            $.ajax({
                url: "https://app6534.acapp.acwing.com.cn/settings/token/refresh/",
                type: "POST",
                data: {
                    refresh: outer.root.refresh,
                },
                success: function (resp) {
                    outer.root.access = resp.access
                }
            });
        }, 4.5 * 60 * 1000);  //设置4.5min刷新，防止网络延迟而超时5min
    }

    events() {
        this.events_login();
        this.events_register();

        let outer = this;
        this.$third_part_login.on("click", function () {
            outer.third_part_login_web();
        });
    }

    events_login() {
        let outer = this;
        this.$login_register.on("click", function () {
            outer.register();  //点击后跳转注册页面
        });
        this.$login_submit.on("click", function () {
            outer.sign_in();  //点击后登录
        });
    }

    events_register() {
        let outer = this;
        this.$register_login.on("click", function () {
            outer.login();
        });
        this.$register_submit.on("click", function () {
            outer.new_register();
        });
    }

    third_part_login_web() {
        $.ajax({
            url: "https://app6534.acapp.acwing.com.cn/settings/acwing/web/apply_code/",
            type: "GET",
            success: function (resp) {
                if (resp.result === "success") {
                    window.location.replace(resp.apply_code_url);
                    //窗口刷新，并重定向到 apply_code_url
                }//acwing的第三方登录如果点击拒绝则会重定向到acwing首页
            }
        });
    }

    third_part_login_acapp(appid, redirect_uri, scope, state) {
        let outer = this;

        this.root.os.api.oauth2.authorize(appid, redirect_uri, scope, state, function (resp) {
            //手动实现callback
            if (resp.result === "success") {
                //同web操作
                outer.username = resp.username;
                outer.photo = resp.photo;
                outer.hide();
                outer.root.menu.show();
                outer.root.access = resp.access;
                outer.root.refresh = resp.refresh;
                outer.refresh_jwt();
            }//acwing没有提供用户拒绝后的api，所以用户拒绝后会比较尴尬，直接卡住
        });
    }

    sign_in(username, password) {
        //登录函数
        let outer = this;
        username = username || this.$login_username.val(); //获取用户输入，如果是注册则直接登录
        password = password || this.$login_password.val();
        this.$login_error_message.empty(); //清空之前的报错记录

        $.ajax({
            url: "https://app6534.acapp.acwing.com.cn/settings/token/",
            type: "POST",
            data: {
                username: username,
                password: password,
            },
            success: function (resp) {
                outer.root.access = resp.access;
                outer.root.refresh = resp.refresh;
                outer.refresh_jwt();
                outer.getinfo_web();
            },
            error: function () {
                outer.$login_error_message.html("用户名或密码错误");
            }
        });
    }

    new_register() {
        let outer = this;
        let username = this.$register_username.val();
        let password = this.$register_password.val();
        let password_confirm = this.$register_password_confirm.val();
        this.$register_error_message.empty();

        $.ajax({
            url: "https://app6534.acapp.acwing.com.cn/settings/register/",
            type: "post",
            data: {
                username: username,
                password: password,
                password_confirm: password_confirm,
            },
            success: function (resp) {
                if (resp.result === "success") {
                    outer.sign_in(username, password);
                } else {
                    outer.$register_error_message.html(resp.result);
                }
            }
        });

    }

    sign_out() {
        if (this.platform === "ACAPP") {
            this.root.os.api.window.close();
        } else {
            //登出只要删除jwt即可
            this.root.access = "";
            this.root.refresh = "";
            location.href = "/";  //重定向到主页面（即index界面）
        }
    }

    register() {
        //打开注册页面
        this.$login.hide();
        this.$register.show();
    }

    login() {
        //打开登录界面
        this.$register.hide();
        this.$login.show();
    }

    getinfo_web() {
        //获取用户信息
        let outer = this;

        $.ajax({
            //jQuery库的ajax发送请求
            url: "https://app6534.acapp.acwing.com.cn/settings/getinfo/",   //请求地址
            type: "GET",   //请求方式
            data: {   //传输数据
                platform: outer.platform,
            },
            headers: {    //身份验证，格式见settings.py
                'Authorization': "Bearer " + outer.root.access,
            },
            success: function (resp) {   //return函数，不要被success名字迷惑。   resp就是JsonResponse
                //request -> resp(onse)
                if (resp.result === "success") {  //登录成功
                    outer.username = resp.username;  //获取信息
                    outer.photo = resp.photo;
                    outer.hide();
                    outer.root.menu.show();
                } else {   //未登录
                    outer.login();
                }
            }
        })
    }

    getinfo_acapp() {
        let outer = this;
        $.ajax({
            url: "https://app6534.acapp.acwing.com.cn/settings/acwing/acapp/apply_code/",
            type: "GET",
            success: function (resp) {
                if (resp.result === "success") {
                    //根据acwing的api传参即可
                    outer.third_part_login_acapp(resp.appid, resp.redirect_uri, resp.scope, resp.state);
                }
            }
        });
    }

    hide() {
        this.$settings.hide();
    }

    show() {
        this.$settings.show();
    }

}
