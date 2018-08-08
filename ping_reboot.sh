#!/bin/bash
# 初始化環境變量
source /root/.bash_profile


# 無線循環
while :
do
    sleep 3m
    ping=`ping -c 3 www.google.com|awk 'NR==7 {print $4}'`
    if [ $ping -eq 0 ]
        then
            # 執行操作
            reboot
            break
    fi
done


